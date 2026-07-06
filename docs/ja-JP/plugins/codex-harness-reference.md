---
read_when:
    - すべての Codex ハーネス設定フィールドが必要です
    - app-server のトランスポート、認証、検出、またはタイムアウト動作を変更しています
    - Codex ハーネスの起動、モデル検出、または環境分離をデバッグしている
summary: Codex ハーネスの構成、認証、検出、アプリサーバーのリファレンス
title: Codex ハーネスリファレンス
x-i18n:
    generated_at: "2026-07-06T21:51:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed382bb5585cf9ca54fe7d6607cfac923dea2f2636de98fc4b621bdaa47cb1d1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

このリファレンスでは、同梱の `codex` Plugin の詳細設定を扱います。
セットアップとルーティングの判断については、
[Codex ハーネス](/ja-JP/plugins/codex-harness)から始めてください。

## Plugin 設定サーフェス

すべての Codex ハーネス設定は `plugins.entries.codex.config` 配下にあります。

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

トップレベルのフィールド:

| フィールド                 | デフォルト             | 意味                                                                                                                                           |
| -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 有効                   | Codex app-server `model/list` のモデル検出設定。                                                                                               |
| `appServer`                | 管理対象の stdio app-server | トランスポート、コマンド、認証、承認、サンドボックス、タイムアウトの設定。                                                                     |
| `codexDynamicToolsLoading` | `"searchable"`         | OpenClaw 動的ツールを初期 Codex ツールコンテキストに直接配置するには `"direct"` を使用します。                                                 |
| `codexDynamicToolsExclude` | `[]`                   | Codex app-server ターンから省略する追加の OpenClaw 動的ツール名。                                                                              |
| `codexPlugins`             | 無効                   | 接続済みアカウント app へのオプトインアクセスを含む、ネイティブ Codex Plugin/app サポート。[ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)を参照してください。 |
| `computerUse`              | 無効                   | Codex Computer Use のセットアップ。[Codex Computer Use](/ja-JP/plugins/codex-computer-use)を参照してください。                                       |

## App-server トランスポート

デフォルトでは、OpenClaw は同梱 Plugin に含まれる管理対象の Codex バイナリ
（現在は `@openai/codex` `0.142.5`）を起動します。

```bash
codex app-server --listen stdio://
```

これにより、app-server のバージョンは、ローカルにたまたまインストールされている
別の Codex CLI ではなく、同梱の `codex` Plugin に紐づきます。
意図的に別の実行ファイルを使いたい場合にのみ、`appServer.command` を設定してください。

すでに実行中の app-server には、WebSocket トランスポートを使用します。

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

`appServer` フィールド:

| フィールド                                    | 既定値                                                 | 意味                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                              | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。                                                                                                                                                                                                                                                                                                                                      |
| `homeScope`                                   | `"agent"`                                              | `"agent"` は OpenClaw agent ごとに Codex 状態を分離します。`"user"` はネイティブの `$CODEX_HOME` または `~/.codex` を共有し、ネイティブ認証を使用して、オーナー専用のスレッド管理を有効にします。ユーザースコープには stdio が必要です。                                                                                                                                                                  |
| `command`                                     | 管理対象の Codex バイナリ                              | stdio トランスポートの実行ファイルです。管理対象バイナリを使用するには未設定のままにします。                                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio トランスポートの引数です。                                                                                                                                                                                                                                                                                                                                                                        |
| `url`                                         | 未設定                                                 | WebSocket app-server URL です。                                                                                                                                                                                                                                                                                                                                                                        |
| `authToken`                                   | 未設定                                                 | WebSocket トランスポートのベアラートークンです。リテラル文字列、または `${CODEX_APP_SERVER_TOKEN}` のような SecretInput を受け付けます。                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                   | 追加の WebSocket ヘッダーです。ヘッダー値には、リテラル文字列または SecretInput 値を指定できます。例: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`。                                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                   | OpenClaw が継承環境を構築した後、起動された stdio app-server プロセスから削除される追加の環境変数名です。                                                                                                                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | 未設定                                                 | リモート Codex app-server のワークスペースルートです。設定すると、OpenClaw は解決済みの OpenClaw ワークスペースからローカルワークスペースルートを推論し、このリモートルート配下で現在の cwd サフィックスを保持し、最終的な app-server cwd のみを Codex に送信します。cwd が解決済みの OpenClaw ワークスペースルート外にある場合、OpenClaw は Gateway ローカルパスをリモート app-server に送信せず、fail closed します。 |
| `requestTimeoutMs`                            | `60000`                                                | app-server コントロールプレーン呼び出しのタイムアウトです。                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex がターンを受け付けた後、またはターンスコープの app-server リクエスト後に、OpenClaw が `turn/completed` を待機する間の無音ウィンドウです。                                                                                                                                                                                                                                                         |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | ツールへのハンドオフ、ネイティブツールの完了、ツール後の raw assistant 進行、raw reasoning の完了、または reasoning 進行の後に、OpenClaw が `turn/completed` を待機する間に使用される完了アイドルおよび進行ガードです。ツール後の合成が最終 assistant リリース予算より長く正当に無音のままでいられる、信頼済みまたは重いワークロードに使用します。                                      |
| `mode`                                        | ローカル Codex 要件が YOLO を許可しない場合を除き `"yolo"` | YOLO または guardian レビュー付き実行のプリセットです。                                                                                                                                                                                                                                                                                                                                                |
| `approvalPolicy`                              | `"never"` または許可された guardian 承認ポリシー       | スレッド開始、再開、ターンに送信されるネイティブ Codex 承認ポリシーです。                                                                                                                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` または許可された guardian サンドボックス | スレッド開始と再開に送信されるネイティブ Codex サンドボックスモードです。有効な OpenClaw サンドボックスは、`danger-full-access` ターンを Codex `workspace-write` に狭めます。ターンのネットワークフラグは OpenClaw サンドボックスの egress に従います。                                                                                                                                                   |
| `approvalsReviewer`                           | `"user"` または許可された guardian レビュアー          | 許可されている場合に Codex がネイティブ承認プロンプトをレビューするには、`"auto_review"` を使用します。                                                                                                                                                                                                                                                                                                |
| `defaultWorkspaceDir`                         | 現在のプロセスディレクトリ                             | `--cwd` が省略されたときに `/codex bind` が使用するワークスペースです。                                                                                                                                                                                                                                                                                                                                 |
| `serviceTier`                                 | 未設定                                                 | 任意の Codex app-server サービス階層です。`"priority"` は fast-mode ルーティングを有効にし、`"flex"` は flex 処理を要求し、`null` はオーバーライドをクリアします。レガシーの `"fast"` は `"priority"` として受け付けられます。                                                                                                                                                                             |
| `networkProxy`                                | 無効                                                   | app-server コマンドに対して Codex permissions-profile ネットワーキングを有効にします。OpenClaw は、`sandbox` を送信する代わりに、選択された `permissions.<profile>.network` 設定を定義し、`default_permissions` でそれを選択します。                                                                                                                                                                      |
| `experimental.sandboxExecServer`              | `false`                                                | Codex app-server 0.132.0 以降で、OpenClaw サンドボックスに裏付けられた Codex 環境を登録するプレビューのオプトインです。これにより、ネイティブ Codex 実行を有効な OpenClaw サンドボックス内で実行できます。                                                                                                                                                                                              |

`appServer.networkProxy` は、Codex サンドボックス契約を変更するため明示的です。
有効にすると、OpenClaw は Codex スレッド設定で `features.network_proxy.enabled` と
`default_permissions` も設定し、生成された権限プロファイルが Codex 管理の
ネットワーキングを開始できるようにします。OpenClaw は既定で、プロファイル本文から
衝突耐性のある `openclaw-network-<fingerprint>` プロファイル名を生成します。
安定したローカル名が必要な場合にのみ `profileName` を使用してください。

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

通常の app-server ランタイムが `danger-full-access` になる場合、`networkProxy` を有効にすると、生成される権限プロファイルには代わりに workspace 形式のファイルシステムアクセスが使用されます。Codex 管理のネットワーク強制はサンドボックス化されたネットワークであるため、full-access プロファイルではアウトバウンドトラフィックを保護できません。

この Plugin は、古い、またはバージョンなしの app-server ハンドシェイクをブロックします。Codex app-server は安定版バージョン `0.125.0` 以降を報告する必要があります。

OpenClaw は、非ループバック WebSocket app-server URL をリモートとして扱い、`appServer.authToken` または `Authorization` ヘッダーによる、ID を伴う WebSocket 認証を必須にします。`appServer.authToken` と各 `appServer.headers.*` 値には SecretInput を指定できます。OpenClaw が app-server 起動オプションを構築する前に、secrets ランタイムが SecretRef と env 省略形を解決し、未解決の構造化 SecretRef はトークンやヘッダーが送信される前に失敗します。ネイティブ Codex plugins が設定されている場合、OpenClaw は接続先 app-server の Plugin コントロールプレーンを使用してそれらの plugins をインストールまたは更新し、その後 app インベントリを更新して、Plugin 所有の apps が Codex thread から見えるようにします。`app/list` は引き続き正式なインベントリおよびメタデータソースですが、一覧にあるアクセス可能な app について、Codex が現在無効とマークしている場合でも `thread/start` が `config.apps[appId].enabled = true` を送信するかどうかは OpenClaw ポリシーが決定します。不明または欠落している app ids は fail-closed のままです。このパスは `plugin/install` 経由で marketplace plugins を有効化し、インベントリを更新するだけです。OpenClaw 管理の Plugin インストールと app インベントリ更新を受け入れる信頼済みのリモート app-server にのみ OpenClaw を接続してください。

## 承認とサンドボックスモード

ローカル stdio app-server セッションは既定で YOLO モードになります:
`approvalPolicy: "never"`、`approvalsReviewer: "user"`、および
`sandbox: "danger-full-access"`。この信頼済みローカル operator 姿勢により、無人の OpenClaw turns と Heartbeat は、応答できる人がいないネイティブ承認プロンプトなしで進行できます。

Codex のローカルシステム要件ファイルが暗黙の YOLO 承認、reviewer、または sandbox 値を許可しない場合、OpenClaw は暗黙の既定値を代わりに guardian として扱い、許可された guardian 権限を選択します。`tools.exec.mode: "auto"` も guardian レビュー付き Codex 承認を強制し、安全でないレガシーの `approvalPolicy: "never"` または `sandbox: "danger-full-access"` override を保持しません。意図的に承認なしの姿勢にするには `tools.exec.mode: "full"` を設定してください。同じ要件ファイル内の hostname 一致 `[[remote_sandbox_config]]` エントリは、sandbox 既定値の決定で尊重されます。

Codex guardian レビュー付き承認には `appServer.mode: "guardian"` を設定します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

`guardian` プリセットは、それらの値が許可されている場合、`approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"`、および `sandbox: "workspace-write"` に展開されます。個別のポリシーフィールドは `mode` を上書きします。古い `guardian_subagent` reviewer 値は互換性 alias として引き続き受け入れられますが、新しい config では `auto_review` を使用してください。

OpenClaw sandbox が有効な場合でも、ローカル Codex app-server プロセスは Gateway ホスト上で実行されます。そのため OpenClaw は、その turn では Codex ネイティブ Code Mode、ユーザー MCP servers、app-backed Plugin execution を無効化し、Codex ホスト側 sandboxing を OpenClaw sandbox backend と同等には扱いません。通常の exec/process tools が利用可能な場合、shell access は `sandbox_exec` や `sandbox_process` などの OpenClaw sandbox-backed dynamic tools を通じて公開されます。

<Note>
Docker-backed OpenClaw sandbox ホスト（`agents.defaults.sandbox.mode` が Docker backend に設定されている場合）では、`openclaw doctor` が、sandbox container 内で `workspace-write` shell execution を行うためにネストされた Codex `bwrap` が必要とする、非特権ユーザー（および Docker sandbox network egress が無効な場合は network）namespaces をホストが許可しているかを確認します。失敗した probe は通常、Ubuntu/AppArmor ホスト上で `bwrap: setting up uid map: Permission denied` または `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` として現れます。報告されたホスト namespace ポリシーを OpenClaw service user 用に修正し、gateway を再起動してください。ホスト全体の `kernel.apparmor_restrict_unprivileged_userns=0` fallback よりも、service process 用のスコープされた AppArmor profile を優先し、ネストされた `bwrap` を満たすためだけに、より広い Docker container privileges を付与しないでください。
</Note>

## サンドボックス化されたネイティブ実行

安定した既定値は fail-closed です。有効な OpenClaw sandboxing は、そうでなければ Codex app-server ホストから実行される Codex ネイティブ実行サーフェスを無効化します。Codex のリモート環境サポートを OpenClaw の sandbox backend と試したい場合にのみ、`appServer.experimental.sandboxExecServer: true` を使用してください。このプレビューパスには Codex app-server 0.132.0 以降が必要です。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

このフラグがオンで、現在の OpenClaw セッションが sandboxed の場合、OpenClaw は有効な sandbox に backed された local loopback exec-server を起動し、それを Codex app-server に登録し、その OpenClaw-owned environment で Codex thread と turn を開始します。app-server が environment を登録できない場合、host execution へ黙って fallback するのではなく、run は fail closed します。

このプレビューパスは local-only です。リモート WebSocket app-server は、同じホスト上で実行されていない限り loopback exec-server に到達できないため、OpenClaw はその組み合わせを拒否します。

## 認証と環境分離

既定の per-agent home では、認証は次の順序で選択されます:

1. その agent に対する明示的な OpenClaw Codex auth profile。
2. その agent の Codex home にある app-server の既存 account。
3. ローカル stdio app-server launches の場合のみ、app-server account が存在せず OpenAI auth がまだ必要なときに、`CODEX_API_KEY`、次に
   `OPENAI_API_KEY`。

OpenClaw が ChatGPT subscription-style Codex auth profile（OAuth または token credential type）を検出すると、spawned Codex child process から `CODEX_API_KEY` と `OPENAI_API_KEY` を削除します。これにより、Gateway-level API keys を embeddings や direct OpenAI models に利用可能なままにしつつ、ネイティブ Codex app-server turns が誤って API 経由で課金されることを防ぎます。

明示的な Codex API-key profiles とローカル stdio env-key fallback は、継承された child-process env ではなく app-server login を使用します。WebSocket app-server connections は Gateway env API-key fallback を受け取りません。明示的な auth profile またはリモート app-server 自身の account を使用してください。

Stdio app-server launches は、既定で OpenClaw の process environment を継承します。OpenClaw は Codex app-server account bridge を所有し、`CODEX_HOME` をその agent の OpenClaw state 配下の per-agent directory に設定します。これにより、Codex config、accounts、Plugin cache/data、thread state は、operator の個人用 `~/.codex` home から漏れ込むのではなく、OpenClaw agent にスコープされます。

ネイティブ Codex state を Codex Desktop および CLI と共有するには、`appServer.homeScope: "user"` を設定します。この local-stdio-only モードでは、`$CODEX_HOME` が設定されている場合はそれを使用し、それ以外の場合は `~/.codex` を使用します。これにはネイティブ auth、config、plugins、threads が含まれます。OpenClaw は app-server に対する auth-profile bridge をスキップします。検証済み owner turns は `codex_threads` を使用して、それらの threads を一覧表示（任意の `search` filter 付き）、read、fork、rename、archive、unarchive できます。OpenClaw で継続する前に thread を fork してください。独立した Codex processes は、同じ thread に対する concurrent writers を調整しません。

OpenClaw は通常のローカル app-server launches では `HOME` を書き換えません。`openclaw`、`gh`、`git`、cloud CLIs、shell commands などの Codex-run subprocesses は通常の process home を参照し、user-home config と tokens を見つけることができます。Codex は `$HOME/.agents/skills` と `$HOME/.agents/plugins/marketplace.json` も検出する場合があります。その `.agents` discovery は operator home と意図的に共有され、分離された `~/.codex` state とは別です。

既定の agent scope では、OpenClaw plugins と OpenClaw skill snapshots は引き続き OpenClaw 独自の Plugin registry と skill loader を通じて流れます。個人用 Codex `~/.codex` assets は流れません。分離された OpenClaw agent の一部にすべき有用な Codex CLI skills または plugins が Codex home にある場合、それらを明示的に inventory してください:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

deployment に追加の environment isolation が必要な場合は、それらの variables を `appServer.clearEnv` に追加します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` は、spawned Codex app-server child process にのみ影響します。OpenClaw はローカル launch normalization 中に、このリストから `CODEX_HOME` と `HOME` を削除します。`CODEX_HOME` は選択された agent または user scope を指し続け、`HOME` は subprocesses が通常の user-home state を使用できるよう継承されたままになります。

## Dynamic tools

Codex dynamic tools は既定で `searchable` loading になり、`deferLoading: true` で `openclaw` namespace 配下に公開されます。OpenClaw は、Codex ネイティブ workspace operations や Codex 自身の tool-search surface と重複する dynamic tools を公開しません:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

messaging、media、Cron、browser、nodes、gateway、`heartbeat_respond`、`web_search` など、残りの OpenClaw integration tools のほとんどは、その namespace 配下の Codex tool search を通じて利用できます。これにより、初期 model context を小さく保てます。Codex tool search が利用できない、または connector-only universe に解決される可能性があるため、少数の tools は `codexDynamicToolsLoading` に関係なく直接呼び出し可能なままです: `agents_list`、`sessions_spawn`、`sessions_yield`。Developer instructions は引き続き通常の Codex subagents を Codex-native subagent work ではネイティブ `spawn_agent` に誘導します。一方、`sessions_spawn` は明示的な OpenClaw または ACP delegation のために利用可能なままです。Message-tool-only source replies も direct のままです。これは turn-control contract であるためです。

deferred dynamic tools を検索できない custom Codex app-server に接続する場合、または full tool payload をデバッグする場合にのみ、`codexDynamicToolsLoading: "direct"` を設定してください。

## タイムアウト

OpenClaw-owned dynamic tool calls は `appServer.requestTimeoutMs` とは独立して制限されます。各 Codex `item/tool/call` request は、次の順序で最初に利用可能な timeout を使用します:

- 正の per-call `timeoutMs` argument。
- `image_generate` の場合、`agents.defaults.imageGenerationModel.timeoutMs`。
- configured timeout のない `image_generate` の場合、120 秒の image-generation default。
- media-understanding `image` tool の場合、`tools.media.image.timeoutSeconds` を milliseconds に変換した値、または 60 秒の media default。image understanding では、これは request 自体に適用され、以前の preparation work によって短縮されません。
- `message` tool の場合、固定の 120 秒 default。
- 90 秒の dynamic-tool default。

この watchdog は外側の dynamic `item/tool/call` budget です。Provider-specific request timeouts はその call 内で実行され、独自の timeout semantics を維持します。Dynamic tool budgets は 600000 ms に capped されます。timeout 時、OpenClaw はサポートされている場合 tool signal を abort し、failed dynamic-tool response を Codex に返すことで、session を `processing` のまま残すのではなく turn を継続できるようにします。

Codex がターンを受け入れた後、および OpenClaw がターンスコープの
app-server リクエストに応答した後、ハーネスは Codex が現在のターンで進捗し、
最終的に `turn/completed` でネイティブターンを完了することを期待します。
app-server が `appServer.turnCompletionIdleTimeoutMs` の間静かになると、OpenClaw は
ベストエフォートで Codex ターンに割り込み、診断用タイムアウトを記録し、
OpenClaw セッションレーンを解放して、後続のチャットメッセージが古いネイティブターンの後ろに
キューされないようにします。

同じターンのほとんどの非終端通知は、この短いウォッチドッグを解除します。
Codex がターンがまだ生きていることを証明したためです。ツールの引き渡しでは、より長い
ツール後アイドル予算を使用します。OpenClaw が `item/tool/call` 応答を返した後、
`commandExecution` などのネイティブツール項目が完了した後、生の
`custom_tool_call_output` 完了後、およびツール後の生のアシスタント進捗、
生の推論完了、または推論進捗の後です。このガードは、設定されている場合は
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` を使用し、そうでなければ
デフォルトで 5 分になります。同じツール後予算は、Codex が次の現在ターンイベントを
発行する前の静かな合成ウィンドウでも進捗ウォッチドッグを延長します。推論完了、
commentary `agentMessage` 完了、およびツール前の生の推論またはアシスタント進捗の後には
自動的な最終返信が続く場合があるため、セッションレーンをすぐに解放する代わりに
進捗後返信ガードを使用します。最終または非 commentary の完了済み `agentMessage` 項目と
ツール前の生のアシスタント完了だけが、アシスタント出力解放を作動させます。
その後 Codex が `turn/completed` なしで静かになった場合、OpenClaw は
ベストエフォートでネイティブターンに割り込み、セッションレーンを解放します。
アシスタント、ツール、アクティブ項目、または副作用の証拠がないターン完了アイドルタイムアウトを含む、
リプレイセーフな stdio app-server 障害は、新しい app-server 試行で 1 回再試行されます。
安全でないタイムアウトでも、詰まった app-server クライアントは退役され、
OpenClaw セッションレーンは解放されます。また、自動的にリプレイされる代わりに、
古いネイティブスレッドのバインディングもクリアされます。完了監視タイムアウトは
Codex 固有のタイムアウト文言を表示します。リプレイセーフなケースでは応答が不完全な可能性があると伝え、
安全でないケースでは再試行前に現在の状態を確認するようユーザーに伝えます。
公開タイムアウト診断には、最後の app-server 通知メソッド、生のアシスタント応答項目の
id/type/role、アクティブなリクエスト数および項目数、作動中の監視状態などの
構造化フィールドが含まれます。最後の通知が生のアシスタント応答項目である場合は、
境界付きのアシスタントテキストプレビューも含まれます。生のプロンプトやツール内容は
含まれません。

## モデル検出

デフォルトでは、Codex Plugin は app-server に利用可能なモデルを問い合わせます。モデルの
可用性は Codex app-server が所有するため、OpenClaw がバンドルされた `@openai/codex` バージョンを
アップグレードした場合や、デプロイが `appServer.command` を別の Codex バイナリに向けた場合に
リストが変わることがあります。可用性はアカウントスコープにもなり得ます。実行中の Gateway で
`/codex models` を使用して、そのハーネスとアカウントのライブカタログを確認してください。

検出が失敗またはタイムアウトした場合、OpenClaw はバンドルされたフォールバックカタログを使用します。

| モデル id      | 表示名       | 推論エフォート          |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
現在バンドルされているハーネスは `@openai/codex` `0.142.5` です。そのバンドルされた
app-server に対する `model/list` プローブは、フォールバックカタログを超えて次の公開ピッカー行を返しました。

| モデル id             | 入力モダリティ | 推論エフォート          |
| --------------------- | -------------- | ------------------------ |
| `gpt-5.5`             | text, image    | low, medium, high, xhigh |
| `gpt-5.4`             | text, image    | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image    | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text           | low, medium, high, xhigh |

ライブピッカー行はアカウントスコープであり、アカウント、Codex カタログ、またはバンドルバージョンによって
変わることがあります。特定時点の表に依存するのではなく、現在のリストには `/codex models` を実行してください。
非表示モデルも、通常のモデルピッカー選択肢ではないまま、内部または特殊なフロー向けに
app-server カタログに現れる場合があります。
</Note>

`plugins.entries.codex.config.discovery` で検出を調整します。

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

起動時に Codex のプローブを避け、フォールバックカタログのみを使用したい場合は、検出を無効にします。

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

## ワークスペースのブートストラップファイル

Codex はネイティブのプロジェクトドキュメント検出を通じて `AGENTS.md` を自ら処理します。
OpenClaw は合成 Codex プロジェクトドキュメントファイルを書き込まず、ペルソナファイル用の
Codex フォールバックファイル名にも依存しません。Codex のフォールバックは `AGENTS.md` が
存在しない場合にのみ適用されるためです。

OpenClaw ワークスペースの同等性のため、Codex ハーネスは他のブートストラップファイルを
開発者指示として転送しますが、完全に同一ではありません。

- `TOOLS.md` は **継承された** Codex 開発者指示として転送されるため、
  ターン中に生成されたネイティブ Codex サブエージェントにも見えます。
- `SOUL.md`、`IDENTITY.md`、`USER.md` は **ターンスコープの**
  コラボレーション指示として転送されます。ネイティブ Codex サブエージェントはそれらを継承しません。
  これにより、サブエージェントのターンが親エージェントのペルソナや
  ユーザープロファイルを拾わないようにします。
- コンパクトに読み込まれた OpenClaw Skills リストも、ターンスコープの
  コラボレーション開発者指示として転送されるため、ネイティブ Codex サブエージェントは
  これも継承しません。
- `HEARTBEAT.md` の内容は注入されません。heartbeat ターンには、そのファイルが存在して
  空でない場合に読むためのコラボレーションモードポインターが渡されます。
- 設定されたエージェントワークスペースの `MEMORY.md` 内容は、そのワークスペースで
  メモリツールが利用可能な場合、ネイティブ Codex ターン入力には貼り付けられません。
  存在する場合、ハーネスは小さなワークスペースメモリポインターをターンスコープの
  コラボレーション開発者指示に追加し、永続メモリが関連する場合 Codex は
  `memory_search` または `memory_get` を使用するべきです。ツールが無効化されている場合、
  メモリ検索が利用できない場合、またはアクティブワークスペースがエージェントメモリワークスペースと
  異なる場合、`MEMORY.md` は代わりに通常の境界付きターンコンテキスト経路を使用します。
- `BOOTSTRAP.md` が存在する場合、OpenClaw ターン入力の参照コンテキストとして転送されます。

## 環境オーバーライド

環境オーバーライドはローカルテスト用に引き続き利用できます。

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command` が未設定の場合、`OPENCLAW_CODEX_APP_SERVER_BIN` は管理対象バイナリをバイパスします。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` は削除されました。代わりに
`plugins.entries.codex.config.appServer.mode: "guardian"` を使用するか、単発のローカルテストには
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` を使用してください。再現可能なデプロイでは設定が推奨されます。
これにより、Plugin の動作が Codex ハーネス設定の残りと同じレビュー済みファイル内に保たれるためです。

## 関連

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [ネイティブ Codex Plugin](/ja-JP/plugins/codex-native-plugins)
- [Codex Computer Use](/ja-JP/plugins/codex-computer-use)
- [OpenAI プロバイダー](/ja-JP/providers/openai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference)
