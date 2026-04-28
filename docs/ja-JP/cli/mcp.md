---
read_when:
    - Codex、Claude Code、または他のMCPクライアントをOpenClawバックのチャンネルに接続する
    - '`openclaw mcp serve` を実行中'
    - OpenClawに保存されたMCPサーバー定義を管理する
sidebarTitle: MCP
summary: OpenClawチャンネル会話をMCP経由で公開し、保存済みMCPサーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` には2つの役割があります:

- `openclaw mcp serve` でOpenClawをMCPサーバーとして実行する
- `list`、`show`、`set`、`unset` で、OpenClawが管理する外向きMCPサーバー定義を管理する

言い換えると:

- `serve` は、OpenClawがMCPサーバーとして動作するケースです
- `list` / `show` / `set` / `unset` は、後でそのruntimeが利用する可能性のある他のMCPサーバーに対して、OpenClawがMCPクライアント側レジストリーとして動作するケースです

OpenClaw自身がcoding harness sessionをホストし、そのruntimeをACP経由でルーティングする場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## MCPサーバーとしてのOpenClaw

これは `openclaw mcp serve` の経路です。

### `serve` を使うタイミング

次の場合は `openclaw mcp serve` を使用してください:

- Codex、Claude Code、または他のMCPクライアントが、OpenClawバックのチャンネル会話に直接接続する必要がある
- すでにローカルまたはリモートのOpenClaw Gatewayがあり、session routingが行われている
- チャンネルごとに個別のbridgeを動かす代わりに、OpenClawのチャンネルバックエンド全体で動作する1つのMCPサーバーが欲しい

OpenClawがcoding runtime自体をホストし、agent sessionをOpenClaw内部に保持する場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

### 仕組み

`openclaw mcp serve` はstdio MCPサーバーを起動します。このプロセスはMCPクライアントが所有します。クライアントがstdio sessionを開いたままにしている間、bridgeはWebSocket経由でローカルまたはリモートのOpenClaw Gatewayに接続し、routing済みのチャンネル会話をMCP経由で公開します。

<Steps>
  <Step title="クライアントがbridgeを起動">
    MCPクライアントが `openclaw mcp serve` を起動します。
  </Step>
  <Step title="bridgeがGatewayに接続">
    bridgeがWebSocket経由でOpenClaw Gatewayに接続します。
  </Step>
  <Step title="sessionがMCP会話になる">
    routing済みsessionがMCP会話とtranscript/history toolとして公開されます。
  </Step>
  <Step title="ライブイベントをキューに格納">
    bridgeが接続されている間、ライブイベントはメモリー内にキューされます。
  </Step>
  <Step title="任意のClaude push">
    Claude channel modeが有効な場合、同じsessionはClaude固有のpush通知も受け取れます。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要な動作">
    - ライブキューの状態はbridge接続時に開始されます
    - それ以前のtranscript historyは `messages_read` で読み取ります
    - Claude push通知はMCP sessionが生きている間だけ存在します
    - クライアントが切断すると、bridgeは終了し、ライブキューは消えます
    - `openclaw agent` や `openclaw infer model run` などのone-shot agentエントリーポイントは、返信完了時に自分が開いた同梱MCP runtimeを終了させるため、繰り返しのscript実行でstdio MCP子プロセスが蓄積しません
    - OpenClawが起動したstdio MCPサーバー（同梱またはユーザー設定）は、シャットダウン時にプロセスツリーとして終了されるため、サーバーが起動した子subprocessが親stdio client終了後も生き残ることはありません
    - sessionの削除またはリセットでは、共有runtime cleanup pathを通じてそのsessionのMCP clientも破棄されるため、削除済みsessionに紐づくstdio接続が残り続けることはありません

  </Accordion>
</AccordionGroup>

### クライアントモードを選ぶ

同じbridgeを2通りの方法で使えます:

<Tabs>
  <Tab title="汎用MCPクライアント">
    標準MCP toolのみを使います。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、および承認toolを使用してください。
  </Tab>
  <Tab title="Claude Code">
    標準MCP toolに加えてClaude固有のchannel adapterを使います。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにしてください。
  </Tab>
</Tabs>

<Note>
現時点では、`auto` は `on` と同じ動作です。まだクライアントcapability検出はありません。
</Note>

### `serve` が公開するもの

このbridgeは、既存のGateway session route metadataを使ってチャンネルバックの会話を公開します。会話は、OpenClawがすでに次のような既知ルートを持つsession stateを保持している場合に表示されます:

- `channel`
- recipientまたはdestination metadata
- 任意の `accountId`
- 任意の `threadId`

これにより、MCPクライアントは1か所で次のことができます:

- 最近のrouting済み会話を一覧する
- 最近のtranscript historyを読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送る
- bridge接続中に届いた承認リクエストを見る

### 使用方法

<Tabs>
  <Tab title="ローカルGateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="リモートGateway（token）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="リモートGateway（password）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="詳細ログ / Claudeオフ">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Bridge tools

現在のbridgeは次のMCP toolを公開します:

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway session stateにすでにroute metadataがある、最近のsessionバック会話を一覧します。

    便利なfilter:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    `session_key` で1つの会話を返します。
  </Accordion>
  <Accordion title="messages_read">
    1つのsessionバック会話について最近のtranscript messageを読み取ります。
  </Accordion>
  <Accordion title="attachments_fetch">
    1つのtranscript messageからテキスト以外のmessage content blockを抽出します。これはtranscript contentに対するmetadata viewであり、独立した永続attachment blob storeではありません。
  </Accordion>
  <Accordion title="events_poll">
    数値cursor以降にキューされたライブイベントを読み取ります。
  </Accordion>
  <Accordion title="events_wait">
    次に一致するキュー済みイベントが届くか、timeoutが切れるまでlong-pollします。

    これは、汎用MCPクライアントがClaude固有のpush protocolなしでほぼリアルタイム配信を必要とする場合に使用してください。

  </Accordion>
  <Accordion title="messages_send">
    sessionにすでに記録されている同じrouteを通じてテキストを送信します。

    現在の動作:

    - 既存の会話routeが必要です
    - sessionのchannel、recipient、account id、thread idを使用します
    - テキストのみ送信します

  </Accordion>
  <Accordion title="permissions_list_open">
    bridgeがGateway接続後に観測した、保留中のexec/plugin承認リクエストを一覧します。
  </Accordion>
  <Accordion title="permissions_respond">
    保留中のexec/plugin承認リクエスト1件を次のいずれかで解決します:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### イベントモデル

bridgeは接続中、メモリー内のイベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- キューはライブ専用で、MCP bridge起動時に開始されます
- `events_poll` と `events_wait` は、それだけでは古いGateway historyを再生しません
- 永続backlogは `messages_read` で読んでください

</Warning>

### Claude channel通知

bridgeはClaude固有のchannel通知も公開できます。これはClaude Code channel adapterに対するOpenClaw版です。標準MCP toolは引き続き利用可能ですが、ライブの受信messageはClaude固有のMCP通知として到着することもあります。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 標準MCP toolのみ。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude channel通知を有効化します。
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: 現在のデフォルト。`on` と同じbridge動作です。
  </Tab>
</Tabs>

Claude channel modeが有効な場合、サーバーはClaude experimental capabilitiesを通知し、次を送出できます:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のbridge動作:

- 受信した `user` transcript messageは `notifications/claude/channel` として転送されます
- MCP経由で受け取ったClaude permission requestはメモリー内で追跡されます
- その後、紐付いた会話が `yes abcde` または `no abcde` を送ると、bridgeはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブsession専用です。MCPクライアントが切断すると、push先はなくなります

これは意図的にクライアント固有です。汎用MCPクライアントは標準polling toolに依存してください。

### MCPクライアント設定

stdio client設定例:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

ほとんどの汎用MCPクライアントでは、まず標準tool surfaceから始めてClaude modeは無視してください。Claude固有の通知methodを実際に理解するクライアントに対してだけClaude modeをオンにしてください。

### オプション

`openclaw mcp serve` は次をサポートします:

<ParamField path="--url" type="string">
  Gateway WebSocket URL。
</ParamField>
<ParamField path="--token" type="string">
  Gateway token。
</ParamField>
<ParamField path="--token-file" type="string">
  tokenをファイルから読み取ります。
</ParamField>
<ParamField path="--password" type="string">
  Gateway password。
</ParamField>
<ParamField path="--password-file" type="string">
  passwordをファイルから読み取ります。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude通知モード。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderrに詳細ログを出力します。
</ParamField>

<Tip>
可能であれば、インラインのsecretよりも `--token-file` または `--password-file` を優先してください。
</Tip>

### セキュリティと信頼境界

bridgeはroutingを新たに作り出しません。Gatewayがすでにrouting方法を知っている会話だけを公開します。

つまり:

- sender allowlist、pairing、channelレベルの信頼は、引き続き基盤となるOpenClaw channel設定に属します
- `messages_send` は既存の保存済みrouteを通じてしか返信できません
- 承認状態は現在のbridge sessionに対してのみライブ/インメモリーです
- bridge認証には、他のリモートGateway clientに対して信頼するのと同じGateway tokenまたはpassword制御を使うべきです

会話が `conversations_list` に表示されない場合、通常の原因はMCP設定ではありません。基盤となるGateway sessionにroute metadataがないか、不完全です。

### テスト

OpenClawには、このbridge向けの決定的なDocker smokeが含まれています:

```bash
pnpm test:docker:mcp-channels
```

このsmokeは次を行います:

- シード済みGatewayコンテナーを起動する
- `openclaw mcp serve` を起動する2つ目のコンテナーを起動する
- 会話検出、transcript読み取り、attachment metadata読み取り、ライブイベントキュー動作、送信routeを検証する
- 実際のstdio MCP bridge上でClaudeスタイルのchannel通知とpermission通知を検証する

これは、実際のTelegram、Discord、またはiMessageアカウントをテスト実行に接続せずに、bridgeが動作することを証明する最速の方法です。

より広いテスト文脈については、[Testing](/ja-JP/help/testing) を参照してください。

### トラブルシューティング

<AccordionGroup>
  <Accordion title="会話が返ってこない">
    通常は、そのGateway sessionがまだroute可能でないことを意味します。基盤となるsessionに、channel/provider、recipient、および任意のaccount/thread route metadataが保存されていることを確認してください。
  </Accordion>
  <Accordion title="events_poll または events_wait が古いmessageを取りこぼす">
    想定どおりです。ライブキューはbridge接続時に開始されます。古いtranscript historyは `messages_read` で読んでください。
  </Accordion>
  <Accordion title="Claude通知が表示されない">
    次をすべて確認してください:

    - クライアントがstdio MCP sessionを開いたままにしている
    - `--claude-channel-mode` が `on` または `auto` である
    - クライアントが実際にClaude固有の通知methodを理解している
    - 受信messageがbridge接続後に発生した

  </Accordion>
  <Accordion title="承認が表示されない">
    `permissions_list_open` は、bridge接続中に観測された承認リクエストだけを表示します。これは永続的な承認history APIではありません。
  </Accordion>
</AccordionGroup>

## MCPクライアントレジストリーとしてのOpenClaw

これは `openclaw mcp list`、`show`、`set`、`unset` の経路です。

これらのコマンドは、OpenClawをMCP経由で公開するものではありません。OpenClaw設定内の `mcp.servers` 配下にある、OpenClawが管理するMCPサーバー定義を管理します。

これらの保存済み定義は、embedded Piやその他のruntime adapterのように、OpenClawが後で起動または設定するruntime向けのものです。OpenClawは定義を中央管理するため、それらのruntimeが独自に重複したMCPサーバー一覧を保持する必要がありません。

<AccordionGroup>
  <Accordion title="重要な動作">
    - これらのコマンドはOpenClaw設定の読み書きだけを行います
    - 対象のMCPサーバーには接続しません
    - command、URL、またはリモートtransportが現在到達可能かどうかは検証しません
    - runtime adapterは、実行時に実際にサポートするtransport形状を決定します
    - embedded Piは、通常の `coding` および `messaging` tool profileで設定済みMCP toolを公開します。`minimal` は引き続きそれらを隠し、`tools.deny: ["bundle-mcp"]` で明示的に無効化できます
    - sessionスコープの同梱MCP runtimeは、アイドル時間が `mcp.sessionIdleTtlMs` ミリ秒を超えると回収されます（デフォルト10分。無効化するには `0` を設定）。one-shot embedded実行では、実行終了時にそれらをクリーンアップします

  </Accordion>
</AccordionGroup>

runtime adapterは、この共有レジストリーを下流クライアントが期待する形に正規化する場合があります。たとえば、embedded PiはOpenClawの `transport` 値を直接消費しますが、Claude CodeとGeminiには `http`、`sse`、`stdio` のようなCLIネイティブの `type` 値が渡されます。

### 保存済みMCPサーバー定義

OpenClawは、OpenClaw管理のMCP定義を必要とするサーフェス向けに、設定内に軽量なMCPサーバーレジストリーも保存します。

コマンド:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

注記:

- `list` はサーバー名をソートして表示します。
- `show` は、名前なしだと設定済みMCPサーバーオブジェクト全体を表示します。
- `set` は、コマンドライン上で1つのJSONオブジェクト値を受け取ります。
- `unset` は、指定名のサーバーが存在しない場合は失敗します。

例:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

設定形状の例:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### stdio transport

ローカルの子プロセスを起動し、stdin/stdout経由で通信します。

| Field                      | 説明                          |
| -------------------------- | ----------------------------- |
| `command`                  | 起動する実行ファイル（必須）  |
| `args`                     | コマンドライン引数の配列      |
| `env`                      | 追加の環境変数                |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリー  |

<Warning>
**stdio env安全フィルター**

OpenClawは、stdio MCPサーバーが最初のRPC前にどのように起動するかを変更できるインタープリター起動時環境変数キーを、そのサーバーの `env` ブロック内にあっても拒否します。ブロックされるキーには `NODE_OPTIONS`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4` などのruntime制御変数が含まれます。これらは起動時に設定エラーとして拒否されるため、暗黙のprelude注入、インタープリター差し替え、stdioプロセスへのdebugger有効化に使えません。通常の認証情報、proxy、およびサーバー固有環境変数（`GITHUB_TOKEN`、`HTTP_PROXY`、カスタム `*_API_KEY` など）は影響を受けません。

MCPサーバーが本当にこれらのブロック対象変数のいずれかを必要とする場合は、stdioサーバーの `env` 配下ではなく、gateway host process側に設定してください。
</Warning>

### SSE / HTTP transport

HTTP Server-Sent Events経由でリモートMCPサーバーに接続します。

| Field                 | 説明                                                            |
| --------------------- | --------------------------------------------------------------- |
| `url`                 | リモートサーバーのHTTPまたはHTTPS URL（必須）                   |
| `headers`             | 任意のHTTPヘッダのキー/値マップ（例: auth token）               |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ms、任意）                      |

例:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url` 内の機密値（userinfo）と `headers` は、ログとstatus出力ではマスクされます。

### Streamable HTTP transport

`streamable-http` は、`sse` および `stdio` に加わる追加のtransportオプションです。リモートMCPサーバーとの双方向通信にHTTP streamingを使います。

| Field                 | 説明                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | リモートサーバーのHTTPまたはHTTPS URL（必須）                                          |
| `transport`           | このtransportを選ぶには `"streamable-http"` に設定します。省略時はOpenClawは `sse` を使います |
| `headers`             | 任意のHTTPヘッダのキー/値マップ（例: auth token）                                      |
| `connectionTimeoutMs` | サーバーごとの接続タイムアウト（ms、任意）                                             |

例:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
これらのコマンドは保存済み設定だけを管理します。チャンネルbridgeを起動したり、ライブMCPクライアントsessionを開いたり、対象サーバーに到達可能であることを証明したりはしません。
</Note>

## 現在の制限

このページは、現時点で出荷されているbridgeを説明しています。

現在の制限:

- 会話検出は既存のGateway session route metadataに依存します
- Claude固有adapter以外に汎用push protocolはありません
- まだメッセージ編集やリアクション用toolはありません
- HTTP/SSE/streamable-http transportは単一のリモートサーバーに接続します。upstreamの多重化はまだありません
- `permissions_list_open` にはbridge接続中に観測した承認だけが含まれます

## 関連

- [CLI reference](/ja-JP/cli)
- [Plugins](/ja-JP/cli/plugins)
