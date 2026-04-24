---
read_when:
    - バンドル済み Codex app-server ハーネスを使いたい場合
    - Codex モデル ref と設定例が必要です
    - Codex 専用デプロイ向けに PI フォールバックを無効にしたい場合
summary: バンドル済み Codex app-server ハーネスを通して OpenClaw の埋め込みエージェントターンを実行する
title: Codex ハーネス
x-i18n:
    generated_at: "2026-04-24T05:10:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 095933d2c32df302c312c67fdc266d2f01b552dddb1607d6e4ecc4f3c3326acf
    source_path: plugins/codex-harness.md
    workflow: 15
---

バンドル済み `codex` Plugin を使うと、OpenClaw は組み込み PI ハーネスの代わりに
Codex app-server 経由で埋め込みエージェントターンを実行できます。

これは、低レベルのエージェントセッションを Codex に委ねたい場合に使います。具体的には、モデル
検出、ネイティブスレッド再開、ネイティブ Compaction、app-server 実行です。
OpenClaw は引き続き、chat チャンネル、セッションファイル、モデル選択、ツール、
承認、メディア配信、表示用トランスクリプトミラーを担います。

ネイティブ Codex ターンでは、OpenClaw Plugin フックが公開互換レイヤーとして維持されます。
これらはプロセス内 OpenClaw フックであり、Codex の `hooks.json` command フックではありません。

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- ミラーされたトランスクリプトレコード用の `before_message_write`
- `agent_end`

バンドル済み Plugin は、非同期 `tool_result` middleware を追加する
Codex app-server extension factory も登録できます。この middleware は、OpenClaw がツールを実行した後、
結果が Codex に返る前に、OpenClaw の動的ツールに対して実行されます。これは、
OpenClaw 所有のトランスクリプトへの tool-result 書き込みを変換する公開 `tool_result_persist` Plugin フックとは別物です。

このハーネスはデフォルトでオフです。新しい config では、OpenAI model ref は
`openai/gpt-*` のまま正規に保ち、ネイティブ app-server 実行が必要な場合は
`embeddedHarness.runtime: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を明示的に強制してください。
レガシーな `codex/*` model ref は、互換性のため引き続き自動でハーネスを選択します。

## 正しい model prefix を選ぶ

OpenAI 系のルートは prefix ごとに区別されます。PI 経由の Codex OAuth が欲しいなら `openai-codex/*` を使い、直接 OpenAI API アクセスが欲しい場合、または
ネイティブ Codex app-server ハーネスを強制したい場合は `openai/*` を使います。

| Model ref | Runtime path | 使う場面 |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI plumbing を通る OpenAI provider | `OPENAI_API_KEY` による現在の直接 OpenAI Platform API アクセスが欲しい。 |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI を通る OpenAI Codex OAuth | デフォルト PI runner で ChatGPT/Codex サブスクリプション認証を使いたい。 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | 埋め込みエージェントターンでネイティブ Codex app-server 実行を使いたい。 |

GPT-5.5 は現在、OpenClaw では subscription/OAuth 専用です。
PI OAuth には `openai-codex/gpt-5.5` を、Codex
app-server harness には `embeddedHarness.runtime: "codex"` とともに `openai/gpt-5.5` を使用してください。
`openai/gpt-5.5` の direct API-key access は、
OpenAI が public API で GPT-5.5 を有効化した時点でサポートされます。

レガシーな `codex/gpt-*` ref は互換エイリアスとして引き続き受け付けられます。新しい PI
Codex OAuth config では `openai-codex/gpt-*` を使い、新しいネイティブ app-server
harness config では `openai/gpt-*` に加えて `embeddedHarness.runtime:
"codex"` を使ってください。

`agents.defaults.imageModel` も同じ prefix 分割に従います。image understanding を OpenAI
Codex OAuth provider path 経由で実行したい場合は `openai-codex/gpt-*` を使います。image understanding を
制限付き Codex app-server turn 経由で実行したい場合は `codex/gpt-*` を使います。Codex app-server model は
image 入力サポートを広告している必要があります。text-only Codex model では
media turn 開始前に失敗します。

現在のセッションで有効な harness を確認するには `/status` を使ってください。選択結果が意外な場合は、
`agents/harness` サブシステムの debug logging を有効にし、
Gateway の構造化 `agent harness selected` レコードを確認してください。そこには
選択された harness id、選択理由、runtime/fallback policy、および
`auto` モード時には各 Plugin 候補の support 結果が含まれます。

harness 選択は live なセッション制御ではありません。埋め込みターンが実行されると、
OpenClaw はそのセッションに選択した harness id を記録し、同じ session id の以後のターンでも
使い続けます。将来のセッションで別の harness を使いたい場合は、
`embeddedHarness` config または `OPENCLAW_AGENT_RUNTIME` を変更してください。既存会話を PI と Codex の間で切り替える前には、
新しいセッションを始めるために `/new` または `/reset` を使ってください。これにより、
互換性のない 2 つのネイティブセッションシステムを 1 つのトランスクリプトで再生してしまうことを避けられます。

harness pin 導入前に作られたレガシーセッションは、トランスクリプト履歴がある場合、
PI 固定として扱われます。config を変更した後でその会話を Codex に切り替えるには、
`/new` または `/reset` を使用してください。

`/status` は `Fast` の横に有効な非 PI harness を表示します。たとえば
`Fast · codex` のようになります。デフォルトの PI harness は引き続き `Runner: pi (embedded)` と表示され、
別個の harness バッジは追加されません。

## 要件

- バンドル済み `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.118.0` 以降。
- app-server プロセスで利用可能な Codex auth。

この Plugin は、古い app-server ハンドシェイクや version 不明の app-server ハンドシェイクをブロックします。これにより
OpenClaw は、テスト済みのプロトコルサーフェス上にとどまれます。

live と Docker スモークテストでは、認証は通常 `OPENAI_API_KEY` と、任意で
`~/.codex/auth.json` や
`~/.codex/config.toml` のような Codex CLI file から取得されます。ローカル Codex app-server
で使っているのと同じ認証情報を使用してください。

## 最小 config

`openai/gpt-5.5` を使い、バンドル済み Plugin を有効化し、`codex` harness を強制します。

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

config で `plugins.allow` を使用している場合は、そこにも `codex` を含めてください。

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

`agents.defaults.model` または agent model に
`codex/<model>` を設定しているレガシー config は、引き続きバンドル済み `codex` Plugin を自動有効化します。新しい config では、
上記の明示的な `embeddedHarness` エントリーに加えて `openai/<model>` を優先してください。

## 他のモデルを置き換えずに Codex を追加する

レガシーな `codex/*` ref では Codex を選択し、
それ以外では PI を使いたい場合は `runtime: "auto"` を維持してください。新しい config では、
その harness を使う agent に明示的な `runtime: "codex"` を設定することを推奨します。

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

この形では:

- `/model gpt` または `/model openai/gpt-5.5` は、この config では Codex app-server harness を使用します。
- `/model opus` は Anthropic provider path を使用します。
- Codex 以外の model が選ばれた場合、PI が互換ハーネスとして残ります。

## Codex 専用デプロイ

すべての埋め込みエージェントターンが Codex harness を使うことを保証したい場合は、
PI fallback を無効にしてください。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

fallback を無効にすると、Codex Plugin が無効、app-server が古すぎる、
または app-server を起動できない場合、OpenClaw は早い段階で失敗します。

## agent ごとの Codex

デフォルト agent は通常の
auto-selection のままにしつつ、1 つの agent だけを Codex 専用にできます。

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

agent や model の切り替えには通常のセッションコマンドを使います。`/new` は新しい
OpenClaw セッションを作成し、Codex harness は必要に応じて sidecar app-server
thread を作成または再開します。`/reset` は、その thread に対する OpenClaw セッションバインディングをクリアし、
次のターンで current config から再び harness を解決させます。

## モデル検出

デフォルトでは、Codex Plugin は app-server に利用可能モデルを問い合わせます。検出が
失敗またはタイムアウトした場合、次の bundled fallback catalog を使います。

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

起動時に Codex の probe を避け、fallback catalog に固定したい場合は、
discovery を無効にします。

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

デフォルトでは、Plugin はローカルで次のように Codex を起動します。

```bash
codex app-server --listen stdio://
```

デフォルトで、OpenClaw はローカル Codex harness セッションを YOLO モードで起動します:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, および
`sandbox: "danger-full-access"`。これは、自律 Heartbeat 向けに使われる信頼済みローカル operator posture です。Codex は shell と network ツールを、
誰も応答できないネイティブ承認プロンプトで止まることなく使用できます。

Codex guardian レビューによる承認にオプトインするには、`appServer.mode:
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

Guardian はネイティブ Codex の承認 reviewer です。Codex が sandbox から出る、workspace 外に書き込む、または network access のような権限追加を求めると、Codex はその承認リクエストを human prompt ではなく reviewer subagent にルーティングします。reviewer は Codex の risk framework を適用し、その特定リクエストを承認または拒否します。YOLO モードよりガードレールが欲しいが、それでも無人エージェントに進捗させたい場合に Guardian を使ってください。

`guardian` プリセットは、`approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"`, および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは引き続き `mode` を上書きするため、高度なデプロイではプリセットと明示的な選択を混在させられます。

すでに動作中の app-server には、WebSocket transport を使用します。

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

| Field | Default | 意味 |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。 |
| `command`           | `"codex"`                                | stdio transport 用の実行ファイル。 |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio transport 用の引数。 |
| `url`               | unset                                    | WebSocket app-server URL。 |
| `authToken`         | unset                                    | WebSocket transport 用 Bearer token。 |
| `headers`           | `{}`                                     | 追加の WebSocket ヘッダー。 |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。 |
| `mode`              | `"yolo"`                                 | YOLO または guardian レビュー付き実行のプリセット。 |
| `approvalPolicy`    | `"never"`                                | スレッド start/resume/turn に送られるネイティブ Codex 承認ポリシー。 |
| `sandbox`           | `"danger-full-access"`                   | スレッド start/resume に送られるネイティブ Codex sandbox モード。 |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian にプロンプトをレビューさせるには `"guardian_subagent"` を使用します。 |
| `serviceTier`       | unset                                    | 任意の Codex app-server service tier: `"fast"`, `"flex"`, または `null`。無効なレガシー値は無視されます。 |

古い環境変数も、対応する config field が unset の場合は、
ローカルテスト用フォールバックとして引き続き動作します。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使うか、
単発のローカルテストには `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイには、
Codex harness セットアップ全体と同じレビュー済みファイル内に Plugin 挙動を保持できるため、
config の方が推奨されます。

## よくあるレシピ

デフォルト stdio transport を使うローカル Codex:

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

Guardian レビュー付き Codex 承認:

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

モデル切り替えは引き続き OpenClaw が制御します。OpenClaw セッションが
既存の Codex thread にアタッチされている場合、次のターンでは現在選択されている
OpenAI model、provider、approval policy、sandbox、service tier が
再度 app-server に送られます。`openai/gpt-5.5` から `openai/gpt-5.2` に切り替えても、
thread binding は維持されますが、Codex には新しく選択された model で続行するよう求めます。

## Codex コマンド

バンドル済み Plugin は、認可された slash command として `/codex` を登録します。これは
汎用であり、OpenClaw の text command をサポートする任意のチャンネルで動作します。

一般的な形式:

- `/codex status` は、live app-server 接続性、models、account、rate limits、MCP servers、Skills を表示します。
- `/codex models` は、live Codex app-server models を一覧表示します。
- `/codex threads [filter]` は、最近の Codex threads を一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex thread にアタッチします。
- `/codex compact` は、アタッチされた thread の compaction を Codex app-server に要求します。
- `/codex review` は、アタッチされた thread に対する Codex ネイティブ review を開始します。
- `/codex account` は、account と rate-limit 状態を表示します。
- `/codex mcp` は、Codex app-server MCP server 状態を一覧表示します。
- `/codex skills` は、Codex app-server Skills を一覧表示します。

`/codex resume` は、ハーネスが通常ターンで使うのと同じ sidecar binding file を書き込みます。
次のメッセージで、OpenClaw はその Codex thread を再開し、現在選択されている
OpenClaw model を app-server に渡し、extended history を有効のまま維持します。

このコマンドサーフェスには Codex app-server `0.118.0` 以降が必要です。個別の
control method は、将来またはカスタム app-server がその JSON-RPC method を公開していない場合、
`unsupported by this Codex app-server` として報告されます。

## フック境界

Codex harness には 3 つのフックレイヤーがあります。

| Layer | Owner | Purpose |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hooks                 | OpenClaw                 | PI と Codex harness 間の製品/Plugin 互換性。 |
| Codex app-server extension middleware | OpenClaw bundled plugins | OpenClaw 動的ツール周辺のターン単位 adapter 挙動。 |
| Codex native hooks                    | Codex                    | Codex config からの低レベル Codex lifecycle と native tool policy。 |

OpenClaw は、OpenClaw Plugin 挙動をルーティングするために project または global の Codex `hooks.json` file を使いません。Codex native hooks は、
shell policy、native tool result review、stop handling、native compaction/model lifecycle のような Codex 所有操作には有用ですが、
OpenClaw Plugin API ではありません。

OpenClaw 動的ツールでは、Codex が呼び出しを要求した後に OpenClaw がツールを実行するため、
OpenClaw はハーネス adapter 内で、自分が所有する Plugin と middleware の挙動を発火します。Codex ネイティブツールでは、正式なツール記録を Codex が所有します。
OpenClaw は選択されたイベントを mirror できますが、Codex がその操作を app-server または native hook
callback 経由で公開しない限り、ネイティブ Codex thread を書き換えることはできません。

より新しい Codex app-server ビルドが native compaction と model lifecycle
hook event を公開する場合、OpenClaw はそのプロトコルサポートを version-gate し、
意味が誠実な範囲で既存の OpenClaw hook 契約へイベントをマップすべきです。
それまでは、OpenClaw の `before_compaction`, `after_compaction`, `llm_input`, および
`llm_output` event は adapter レベルの観測であり、Codex の内部 request や compaction payload の
byte-for-byte なキャプチャではありません。

## ツール、メディア、Compaction

Codex harness が変更するのは、低レベルの埋め込みエージェント executor だけです。

OpenClaw は引き続きツール一覧を構築し、harness から動的ツール結果を受け取ります。テキスト、画像、動画、音楽、TTS、承認、メッセージングツール出力は、
通常の OpenClaw 配信経路を通り続けます。

Codex MCP ツール承認 elicitations は、Codex が `_meta.codex_approval_kind` を
`"mcp_tool_call"` とマークしたとき、OpenClaw の Plugin 承認フロー経由でルーティングされます。Codex の `request_user_input` プロンプトは元の chat に送り返され、次にキューされた follow-up メッセージは
追加コンテキストとして steer される代わりに、そのネイティブ
server リクエストへの応答になります。その他の MCP elicitation リクエストは引き続き fail closed です。

選択された model が Codex harness を使う場合、ネイティブ thread compaction は
Codex app-server に委譲されます。OpenClaw は、channel history、検索、`/new`、`/reset`、および将来の model または harness 切り替えのために transcript mirror を保持します。この
mirror には、user prompt、最終 assistant text、および app-server が発行した場合の軽量な Codex reasoning または plan record が含まれます。現時点では、OpenClaw は native compaction の開始と完了シグナルのみを記録します。まだ
人間可読な compaction summary や、compaction 後に Codex がどのエントリーを保持したかの監査可能な一覧は公開していません。

Codex が正式な native thread を所有するため、`tool_result_persist` は現在
Codex ネイティブのツール結果記録を書き換えません。これは、
OpenClaw が OpenClaw 所有のセッショントランスクリプトへツール結果を書き込んでいるときにのみ適用されます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、メディア
理解は、引き続き
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, および
`messages.tts` のような対応する provider/model 設定を使用します。

## トラブルシューティング

**Codex が `/model` に表示されない:** `plugins.entries.codex.enabled` を有効にし、
`embeddedHarness.runtime: "codex"` を伴う `openai/gpt-*` model（または
レガシー `codex/*` ref）を選択し、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が Codex ではなく PI を使う:** Codex harness がその実行を引き受けない場合、
OpenClaw は互換バックエンドとして PI を使用することがあります。テスト中に
Codex 選択を強制するには `embeddedHarness.runtime: "codex"` を設定し、
Plugin harness が一致しないときに失敗させるには
`embeddedHarness.fallback: "none"` を設定してください。いったん
Codex app-server が選択されれば、その失敗は追加の fallback config なしで直接表面化します。

**app-server が拒否される:** app-server handshake が
version `0.118.0` 以降を報告するように Codex をアップグレードしてください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs`
を下げるか、discovery を無効にしてください。

**WebSocket transport が即座に失敗する:** `appServer.url`, `authToken`,
およびリモート app-server が同じ Codex app-server プロトコル version を話していることを確認してください。

**Codex 以外の model が PI を使う:** それは `embeddedHarness.runtime: "codex"` を強制した場合（またはレガシー `codex/*` ref を選んだ場合）を除き、想定どおりです。通常の
`openai/gpt-*` とその他の provider ref は、そのまま通常の provider path に残ります。

## 関連

- [Agent Harness Plugins](/ja-JP/plugins/sdk-agent-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Configuration Reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing-live#live-codex-app-server-harness-smoke)
