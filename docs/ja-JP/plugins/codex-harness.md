---
read_when:
    - 同梱の Codex app-server ハーネスを使いたい場合
    - Codex の model ref と設定例が必要な場合
    - Codex 専用デプロイで PI フォールバックを無効化したい場合
summary: 同梱の Codex app-server ハーネスを通じて OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-04-23T14:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex ハーネス

同梱の `codex` Plugin を使うと、OpenClaw は組み込み PI ハーネスの代わりに、Codex app-server を通じて埋め込みエージェントターンを実行できます。

これは、低レベルのエージェントセッションを Codex に担当させたい場合に使います。モデル検出、ネイティブスレッド再開、ネイティブ Compaction、app-server 実行は Codex が担当します。OpenClaw は引き続きチャットチャネル、セッションファイル、モデル選択、ツール、承認、メディア配信、および表示される transcript ミラーを担当します。

ネイティブ Codex ターンも共有 Plugin フックを尊重するため、プロンプト shim、Compaction 対応自動化、ツールミドルウェア、ライフサイクルオブザーバーは PI ハーネスと揃ったままです。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

同梱 Plugin は、非同期 `tool_result` ミドルウェアを追加するための Codex app-server extension factory も登録できます。

このハーネスはデフォルトでは無効です。`codex` Plugin が有効で、解決されたモデルが `codex/*` モデルである場合、または `embeddedHarness.runtime: "codex"` や `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制した場合にのみ選択されます。`codex/*` を一度も設定しなければ、既存の PI、OpenAI、Anthropic、Gemini、local、および custom-provider の実行は現在の動作のままです。

## 正しいモデルプレフィックスを選ぶ

OpenClaw には、OpenAI アクセスと Codex 形状のアクセスで別々の経路があります。

| モデル ref             | ランタイム経路                             | 使う場面                                                                |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenClaw/PI 配線を通る OpenAI provider     | `OPENAI_API_KEY` で OpenAI Platform API に直接アクセスしたい場合。      |
| `openai-codex/gpt-5.4` | PI を通る OpenAI Codex OAuth provider      | Codex app-server ハーネスなしで ChatGPT/Codex OAuth を使いたい場合。    |
| `codex/gpt-5.4`        | 同梱 Codex provider + Codex ハーネス       | 埋め込みエージェントターンでネイティブ Codex app-server 実行を使いたい場合。 |

Codex ハーネスが扱うのは `codex/*` モデル ref のみです。既存の `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、local、および custom provider ref は通常の経路のままです。

## 要件

- 同梱の `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.118.0` 以降。
- app-server プロセスが利用できる Codex 認証。

この Plugin は、古い app-server ハンドシェイクまたはバージョンなしの app-server ハンドシェイクをブロックします。これにより、OpenClaw はテスト済みのプロトコルサーフェス上に留まります。

live テストおよび Docker スモークテストでは、認証は通常 `OPENAI_API_KEY` に加えて、`~/.codex/auth.json` や `~/.codex/config.toml` のような任意の Codex CLI ファイルから取得されます。ローカルの Codex app-server が使うのと同じ認証情報を使用してください。

## 最小設定

`codex/gpt-5.4` を使い、同梱 Plugin を有効化し、`codex` ハーネスを強制します。

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

設定で `plugins.allow` を使っている場合は、そこにも `codex` を含めてください。

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

`agents.defaults.model` または agent のモデルを `codex/<model>` に設定すると、同梱 `codex` Plugin も自動的に有効化されます。明示的な Plugin エントリは、デプロイ意図が明確になるため、共有設定では引き続き有用です。

## 他のモデルを置き換えずに Codex を追加する

`codex/*` モデルには Codex を使い、それ以外には PI を使いたい場合は `runtime: "auto"` のままにしてください。

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

- `/model codex` または `/model codex/gpt-5.4` は Codex app-server ハーネスを使います。
- `/model gpt` または `/model openai/gpt-5.4` は OpenAI provider 経路を使います。
- `/model opus` は Anthropic provider 経路を使います。
- 非 Codex モデルが選ばれた場合、PI が互換ハーネスのまま残ります。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex ハーネスを使うことを保証したい場合は、PI フォールバックを無効にします。

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

環境変数での上書き:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

フォールバックを無効にすると、Codex Plugin が無効、要求モデルが `codex/*` ref ではない、app-server が古すぎる、または app-server を起動できない場合に、OpenClaw は早期に失敗します。

## エージェント単位の Codex

1 つのエージェントだけを Codex 専用にし、デフォルトエージェントは通常の自動選択のままにすることもできます。

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

通常のセッションコマンドでエージェントとモデルを切り替えてください。`/new` は新しい OpenClaw セッションを作成し、Codex ハーネスは必要に応じてその sidecar app-server スレッドを作成または再開します。`/reset` はそのスレッドに対する OpenClaw セッションバインドをクリアします。

## モデル検出

デフォルトでは、Codex Plugin は利用可能なモデルを app-server に問い合わせます。検出に失敗するかタイムアウトした場合は、同梱のフォールバックカタログを使います。

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

検出は `plugins.entries.codex.config.discovery` で調整できます。

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

起動時に Codex のプローブを避け、フォールバックカタログに固定したい場合は検出を無効にします。

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

## App-server 接続とポリシー

デフォルトでは、この Plugin は次のコマンドで Codex をローカル起動します。

```bash
codex app-server --listen stdio://
```

デフォルトでは、OpenClaw はローカル Codex ハーネスセッションを YOLO モードで開始します:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。これは、自律 Heartbeat に使われる信頼済みローカル operator の姿勢です。Codex は、ネイティブ承認プロンプトに応答できる人が誰もいなくても、shell と network ツールを使えます。

Codex の guardian レビュー付き承認をオプトインするには、`appServer.mode:
"guardian"` を設定します。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

guardian モードは次のように展開されます。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

Guardian はネイティブ Codex 承認レビューアです。Codex が sandbox を出る、workspace 外に書き込む、または network アクセスのような権限を追加する必要がある場合、Codex はその承認リクエストを人間へのプロンプトではなく reviewer subagent にルーティングします。レビューアはコンテキストを集め、Codex のリスクフレームワークを適用して、その特定リクエストを承認または拒否します。Guardian は、YOLO モードより多くのガードレールが欲しい一方で、無人のエージェントや Heartbeat でも進行できる必要がある場合に有用です。

Docker live harness には、`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` のとき Guardian probe が含まれます。Codex ハーネスを Guardian モードで開始し、無害な昇格 shell コマンドが承認されることを検証し、信頼できない外部宛先への偽の secret アップロードが拒否されることを検証して、エージェントが明示的な承認を再要求することを確認します。

個別のポリシーフィールドは引き続き `mode` より優先されるため、高度なデプロイではこのプリセットと明示的な選択を混在できます。

すでに実行中の app-server には、WebSocket トランスポートを使います。

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

| フィールド          | デフォルト                               | 意味                                                                                       |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                        |
| `command`           | `"codex"`                                | stdio トランスポート用の実行ファイル。                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio トランスポート用の引数。                                                             |
| `url`               | unset                                    | WebSocket app-server URL。                                                                 |
| `authToken`         | unset                                    | WebSocket トランスポート用 Bearer トークン。                                               |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。                                                                |
| `requestTimeoutMs`  | `60000`                                  | app-server 制御プレーン呼び出しのタイムアウト。                                            |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行用のプリセット。                                      |
| `approvalPolicy`    | `"never"`                                | スレッド開始/再開/ターン時に送信されるネイティブ Codex 承認ポリシー。                     |
| `sandbox`           | `"danger-full-access"`                   | スレッド開始/再開時に送信されるネイティブ Codex sandbox モード。                           |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian にプロンプトをレビューさせるには `"guardian_subagent"` を使います。         |
| `serviceTier`       | unset                                    | 任意の Codex app-server service tier: `"fast"`、`"flex"`、または `null`。無効な旧値は無視されます。 |

従来の環境変数も、対応する config フィールドが未設定の場合はローカルテスト用フォールバックとして引き続き使えます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、
単発のローカルテストでは `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使ってください。繰り返し可能なデプロイでは config が推奨されます。Codex ハーネス設定の他の部分と同じレビュー済みファイル内に Plugin 動作を保持できるためです。

## よくあるレシピ

デフォルトの stdio トランスポートを使うローカル Codex:

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

PI フォールバックを無効にした Codex 専用ハーネス検証:

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

Guardian レビュー付きの Codex 承認:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

明示的なヘッダー付きのリモート app-server:

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

モデル切り替えは引き続き OpenClaw が制御します。OpenClaw セッションが既存の Codex スレッドに接続されている場合、次のターンでは現在選択されている
`codex/*` モデル、provider、承認ポリシー、sandbox、service tier が再び app-server に送信されます。`codex/gpt-5.4` から `codex/gpt-5.2` に切り替えてもスレッドバインディングは維持されますが、Codex には新しく選択したモデルで続行するよう要求します。

## Codex コマンド

同梱 Plugin は、認可済みスラッシュコマンドとして `/codex` を登録します。これは汎用で、OpenClaw のテキストコマンドをサポートする任意のチャネルで動作します。

よく使う形式:

- `/codex status` は、live の app-server 接続性、モデル、アカウント、レート制限、MCP サーバー、Skills を表示します。
- `/codex models` は、live の Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続済みスレッドの Compaction を Codex app-server に要求します。
- `/codex review` は、接続済みスレッドに対する Codex ネイティブレビューを開始します。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server の MCP サーバー状態を一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。

`/codex resume` は、ハーネスが通常ターンで使うのと同じ sidecar バインディングファイルを書き込みます。次のメッセージで OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw の `codex/*` モデルを app-server に渡し、拡張履歴を有効にしたままにします。

このコマンドサーフェスには Codex app-server `0.118.0` 以降が必要です。将来またはカスタムの app-server がその JSON-RPC メソッドを公開していない場合、個々の制御メソッドは `unsupported by this Codex app-server` と報告されます。

## ツール、メディア、Compaction

Codex ハーネスが変更するのは、低レベルの埋め込みエージェント実行器だけです。

OpenClaw は引き続きツール一覧を構築し、ハーネスから動的なツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、通常の OpenClaw 配信経路を通り続けます。

Codex が `_meta.codex_approval_kind` を
`"mcp_tool_call"` とマークした場合、Codex MCP ツール承認の elicitations は OpenClaw の Plugin 承認フローを通じてルーティングされます。その他の elicitation や自由形式入力リクエストは、引き続き fail-closed になります。

選択されたモデルが Codex ハーネスを使う場合、ネイティブスレッド Compaction は Codex app-server に委譲されます。OpenClaw は、チャネル履歴、検索、`/new`、`/reset`、および将来のモデルまたはハーネス切り替えのために transcript ミラーを保持します。このミラーには、ユーザープロンプト、最終アシスタントテキスト、および app-server が発行した場合の軽量な Codex reasoning または plan レコードが含まれます。現在、OpenClaw はネイティブ Compaction の開始信号と完了信号のみを記録します。Compaction の人間可読な要約や、Compaction 後に Codex がどのエントリを保持したかの監査可能な一覧は、まだ公開していません。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、メディア理解は、`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` など、対応する provider/model 設定を引き続き使います。

## トラブルシューティング

**`/model` に Codex が表示されない:** `plugins.entries.codex.enabled` を有効にし、`codex/*` モデル ref を設定するか、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使う:** Codex ハーネスがその実行を引き受けていない場合、OpenClaw は互換バックエンドとして PI を使うことがあります。テスト中に Codex 選択を強制するには `embeddedHarness.runtime: "codex"` を設定するか、Plugin ハーネスが一致しない場合に失敗させるには `embeddedHarness.fallback: "none"` を設定してください。Codex app-server が選択されると、その失敗は追加のフォールバック設定なしで直接表面化します。

**app-server が拒否される:** app-server ハンドシェイクがバージョン `0.118.0` 以降を報告するよう、Codex をアップグレードしてください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs`
を下げるか、検出を無効にしてください。

**WebSocket トランスポートがすぐ失敗する:** `appServer.url`、`authToken`、およびリモート app-server が同じ Codex app-server プロトコルバージョンを話していることを確認してください。

**非 Codex モデルが PI を使う:** これは想定どおりです。Codex ハーネスが扱うのは `codex/*` モデル ref のみです。

## 関連

- [Agent Harness Plugins](/ja-JP/plugins/sdk-agent-harness)
- [モデル provider](/ja-JP/concepts/model-providers)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing#live-codex-app-server-harness-smoke)
