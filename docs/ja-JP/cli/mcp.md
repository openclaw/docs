---
read_when:
    - Codex、Claude Code、またはその他の MCP クライアントを OpenClaw バックエンドのチャンネルに接続する
    - 実行中 `openclaw mcp serve`
    - OpenClaw が保存した MCP サーバー定義の管理
sidebarTitle: MCP
summary: MCP 経由で OpenClaw のチャネル会話を公開し、保存済みの MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-07-16T11:34:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` には2つの役割があります。

- `openclaw mcp serve` を使用して OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload`、および `unset` を使用して、OpenClaw が管理する送信先 MCP サーバー定義を管理する

`serve` は、OpenClaw が MCP サーバーとして動作するものです。その他のサブコマンドでは、OpenClaw は、独自のランタイムが後で使用できるサーバーの MCP クライアント側レジストリとして動作します。

<Note>
  `list`、`show`、`set`、および `unset` は、OpenClaw 設定内で OpenClaw が管理する `mcp.servers` エントリの読み書きのみを行います。`config/mcporter.json` の mcporter サーバーは含まれません。そのレジストリには `mcporter list` を使用してください。
</Note>

OpenClaw 自体がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## 適切な MCP パスを選択する

| 目的                                                                | 使用するもの                                                                  | 理由                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 外部 MCP クライアントが OpenClaw チャネルの会話を読み取り、送信できるようにする | `openclaw mcp serve`                                                 | OpenClaw が MCP サーバーとなり、Gateway を基盤とする会話を stdio 経由で公開します。                                 |
| OpenClaw が管理するエージェント実行用にサードパーティーの MCP サーバーを保存する        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw が MCP クライアント側レジストリとなり、後でそれらのサーバーを対象となるランタイムに投影します。               |
| エージェントターンを実行せずに保存済みサーバーを確認する                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` と `doctor` は設定を検査し、`probe` は実際の MCP 接続を開いて機能を一覧表示します。               |
| ブラウザーから MCP 設定を編集する                                      | Control UI `/settings/mcp`（`/mcp` エイリアス）                            | このページには、インベントリ、有効化状態、OAuth／フィルターの概要、コマンドのヒント、およびスコープが限定された `mcp` エディターが表示されます。         |
| Codex app-server にスコープが限定されたネイティブ MCP サーバーを提供する                    | `mcp.servers.<name>.codex`                                           | `codex` ブロックは Codex app-server のスレッド投影にのみ影響し、ネイティブ設定へ引き渡す前に取り除かれます。 |
| ACP がホストするハーネスセッションを実行する                                     | [`openclaw acp`](/ja-JP/cli/acp) と [ACP エージェント](/ja-JP/tools/acp-agents-setup) | ACP ブリッジモードではセッション単位の MCP サーバー注入を受け付けません。代わりに Gateway／Plugin ブリッジを設定してください。     |

<Tip>
必要なパスがわからない場合は、まず `openclaw mcp status --verbose` を使用してください。MCP サーバーを起動せずに、OpenClaw が保存している内容を表示します。
</Tip>

## MCP サーバーとしての OpenClaw

これは `openclaw mcp serve` パスです。

### serve を使用する場面

次の場合は `openclaw mcp serve` を使用します。

- Codex、Claude Code、または別の MCP クライアントが、OpenClaw を基盤とするチャネルの会話と直接通信する必要がある
- ルーティング済みセッションを持つローカルまたはリモートの OpenClaw Gateway がすでにある
- チャネルごとに個別のブリッジを実行する代わりに、OpenClaw の各チャネルバックエンドで動作する1つの MCP サーバーが必要である

OpenClaw 自体がコーディングランタイムをホストし、エージェントセッションを OpenClaw 内に保持する場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

### 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。そのプロセスは MCP クライアントが所有します。クライアントが stdio セッションを開いている間、ブリッジは WebSocket 経由でローカルまたはリモートの OpenClaw Gateway に接続し、ルーティング済みのチャネル会話を MCP 経由で公開します。

<Steps>
  <Step title="クライアントがブリッジを起動">
    MCP クライアントが `openclaw mcp serve` を起動します。
  </Step>
  <Step title="ブリッジが Gateway に接続">
    ブリッジが WebSocket 経由で OpenClaw Gateway に接続します。
  </Step>
  <Step title="セッションが MCP の会話になる">
    ルーティング済みセッションが MCP の会話とトランスクリプト／履歴ツールになります。
  </Step>
  <Step title="ライブイベントをキューに格納">
    ブリッジが接続されている間、ライブイベントはメモリ内のキューに格納されます。
  </Step>
  <Step title="任意の Claude プッシュ">
    Claude チャネルモードが有効な場合、同じセッションで Claude 固有のプッシュ通知も受信できます。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要な動作">
    - ライブキューの状態はブリッジの接続時に開始されます
    - 以前のトランスクリプト履歴は `messages_read` で読み取ります
    - Claude のプッシュ通知は MCP セッションが存続している間のみ存在します
    - クライアントが切断すると、ブリッジが終了し、ライブキューは失われます
    - `openclaw agent` や `openclaw infer model run` などのワンショットのエージェントエントリーポイントは、応答が完了すると、開いたバンドル済み MCP ランタイムをすべて終了するため、スクリプトによる実行を繰り返しても stdio MCP 子プロセスが蓄積されません
    - OpenClaw が起動した stdio MCP サーバー（バンドル済みまたはユーザー設定）は、シャットダウン時にプロセスツリーとして終了されるため、サーバーが起動した子サブプロセスが、親 stdio クライアントの終了後も残ることはありません
    - セッションを削除またはリセットすると、共有ランタイムのクリーンアップパスを通じてそのセッションの MCP クライアントが破棄されるため、削除済みセッションに関連付けられた stdio 接続が残ることはありません

  </Accordion>
</AccordionGroup>

### クライアントモードを選択する

<Tabs>
  <Tab title="汎用 MCP クライアント">
    標準 MCP ツールのみです。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、および承認ツールを使用します。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP ツールに加えて、Claude 固有のチャネルアダプターを使用します。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにします。
  </Tab>
</Tabs>

<Note>
現時点では、`auto` は `on` と同じように動作します。クライアント機能の検出はまだありません。
</Note>

### serve が公開するもの

ブリッジは既存の Gateway セッションルートメタデータを使用して、チャネルを基盤とする会話を公開します。OpenClaw に、次のような既知のルートを持つセッション状態がすでに存在する場合、会話が表示されます。

- `channel`
- 受信者または送信先のメタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは1か所で次のことを行えます。

- 最近のルーティング済み会話を一覧表示する
- 最近のトランスクリプト履歴を読み取る
- 新しい受信イベントを待機する
- 同じルートを通じて返信を送り返す
- ブリッジの接続中に届いた承認リクエストを確認する

### 使用方法

<Tabs>
  <Tab title="ローカル Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="リモート Gateway（トークン）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="リモート Gateway（パスワード）">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="詳細出力／Claude 無効">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ブリッジツール

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway のセッション状態にルートメタデータがすでに存在する、最近のセッションベースの会話を一覧表示します。

    フィルター: `limit`（最大500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    Gateway のセッションを直接検索し、`session_key` によって1つの会話を返します。
  </Accordion>
  <Accordion title="messages_read">
    1つのセッションベースの会話について、最近のトランスクリプトメッセージを読み取ります。`limit` のデフォルトは20、最大は200です。
  </Accordion>
  <Accordion title="attachments_fetch">
    1つのトランスクリプトメッセージから、テキスト以外のメッセージコンテンツブロックを抽出します。これはトランスクリプト内容のメタデータビューであり、独立した永続的な添付ファイルの BLOB ストアではありません。
  </Accordion>
  <Accordion title="events_poll">
    数値カーソル以降の、キューに格納されたライブイベントを読み取ります。`limit` は最大200です。
  </Accordion>
  <Accordion title="events_wait">
    次に一致するキュー内イベントが到着するか、タイムアウトするまでロングポーリングします（デフォルト30秒、最大300秒）。

    汎用 MCP クライアントが Claude 固有のプッシュプロトコルを使用せずに、ほぼリアルタイムの配信を必要とする場合に使用します。

  </Accordion>
  <Accordion title="messages_send">
    セッションにすでに記録されている同じルートを通じて、テキストを送り返します。

    現在の動作:

    - 既存の会話ルートが必要です
    - セッションのチャネル、受信者、アカウント ID、スレッド ID を使用します
    - テキストのみを送信します

  </Accordion>
  <Accordion title="permissions_list_open">
    Gateway に接続して以降、ブリッジが検出した保留中の exec／Plugin 承認リクエストを一覧表示します。
  </Accordion>
  <Accordion title="permissions_respond">
    保留中の exec／Plugin 承認リクエスト1件を次のいずれかで解決します。

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### イベントモデル

ブリッジは接続中、メモリ内にイベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- キューはライブ専用であり、MCP ブリッジの起動時に開始されます
- `events_poll` と `events_wait` は、それ自体では以前の Gateway 履歴を再生しません
- 永続的なバックログは `messages_read` で読み取る必要があります

</Warning>

### Claude チャネル通知

ブリッジは Claude 固有のチャネル通知も公開できます。これは Claude Code チャネルアダプターに相当する OpenClaw の機能です。標準 MCP ツールは引き続き使用でき、ライブ受信メッセージを Claude 固有の MCP 通知として受信することもできます。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 標準 MCP ツールのみ。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude チャネル通知を有効にします。
  </Tab>
  <Tab title="auto（デフォルト）">
    `--claude-channel-mode auto`: 現在のデフォルトです。ブリッジの動作は `on` と同じです。
  </Tab>
</Tabs>

Claude チャネルモードが有効な場合、サーバーは Claude の実験的機能を通知し、次を送出できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジの動作:

- 受信した `user` トランスクリプトメッセージは `notifications/claude/channel` として転送されます
- MCP 経由で受信した Claude の権限リクエストはメモリ内で追跡されます
- リンクされた会話のコマンド所有者が後で `yes <id>` または `no <id>`（`<id>` は `l` を除いた5文字のリクエスト ID）を送信すると、ブリッジはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブセッション専用です。MCP クライアントが切断すると、プッシュ先はなくなります

これは意図的にクライアント固有となっています。汎用 MCP クライアントでは、標準のポーリングツールを使用してください。

### MCP クライアント設定

stdio クライアント設定の例:

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

ほとんどの汎用 MCP クライアントでは、標準ツールサーフェスから始め、Claude モードは無視してください。Claude 固有の通知メソッドを実際に理解するクライアントでのみ、Claude モードを有効にしてください。

### オプション

`openclaw mcp serve` は以下をサポートします。

<ParamField path="--url" type="string">
  Gateway WebSocket URL。設定されている場合、デフォルトは `gateway.remote.url` です。
</ParamField>
<ParamField path="--token" type="string">
  Gateway トークン。
</ParamField>
<ParamField path="--token-file" type="string">
  ファイルからトークンを読み取ります。
</ParamField>
<ParamField path="--password" type="string">
  Gateway パスワード。
</ParamField>
<ParamField path="--password-file" type="string">
  ファイルからパスワードを読み取ります。
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude 通知モード。デフォルトは `auto` です。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr に詳細ログを出力します。
</ParamField>

<Tip>
可能な場合は、インラインのシークレットよりも `--token-file` または `--password-file` を使用してください。
</Tip>

### セキュリティと信頼境界

ブリッジがルーティングを作り出すことはありません。Gateway がすでにルーティング方法を把握している会話のみを公開します。

つまり、次のようになります。

- 送信者の許可リスト、ペアリング、チャネルレベルの信頼は、引き続き基盤となる OpenClaw チャネル設定に属します
- `messages_send` は、保存済みの既存ルートを通じてのみ返信できます
- 承認状態は、現在のブリッジセッションに限りライブかつメモリ内にのみ存在します
- ブリッジ認証には、他のリモート Gateway クライアントに対して信頼できるものと同じ Gateway トークンまたはパスワード制御を使用する必要があります

`conversations_list` に会話がない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションのルートメタデータが欠落しているか、不完全であることが原因です。

### テスト

OpenClaw には、このブリッジ向けの決定論的な Docker スモークテストが含まれています。

```bash
pnpm test:docker:mcp-channels
```

このスモークテストは単一のコンテナを実行します。会話状態をシードし、Gateway を起動してから、`openclaw mcp serve` を stdio 子プロセスとして生成し、MCP クライアントとして操作します。実際の stdio MCP ブリッジを介して、会話の検出、トランスクリプトの読み取り、添付ファイルメタデータの読み取り、ライブイベントキューの動作、Claude 形式のチャネル通知および権限通知を検証します。送信ルーティング（保存済み会話ルートを再利用する `messages_send`）は、`src/mcp/channel-server.test.ts` のユニットテストで個別にカバーされています。

これは、実際の Telegram、Discord、または iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明する最速の方法です。

より広範なテストの背景については、[テスト](/ja-JP/help/testing)を参照してください。

### トラブルシューティング

<AccordionGroup>
  <Accordion title="会話が返されない">
    通常、Gateway セッションがまだルーティング可能ではないことを意味します。基盤となるセッションに、チャネル／プロバイダー、受信者、および任意のアカウント／スレッドのルートメタデータが保存されていることを確認してください。
  </Accordion>
  <Accordion title="events_poll または events_wait が古いメッセージを取得しない">
    想定された動作です。ライブキューはブリッジが接続した時点で開始されます。古いトランスクリプト履歴は `messages_read` で読み取ってください。
  </Accordion>
  <Accordion title="Claude 通知が表示されない">
    以下をすべて確認してください。

    - クライアントが stdio MCP セッションを開いたままにしている
    - `--claude-channel-mode` が `on` または `auto` である
    - クライアントが実際に Claude 固有の通知メソッドを理解している
    - 受信メッセージがブリッジの接続後に発生した

  </Accordion>
  <Accordion title="承認がない">
    `permissions_list_open` に表示されるのは、ブリッジの接続中に観測された承認リクエストのみです。これは永続的な承認履歴 API ではありません。
  </Accordion>
</AccordionGroup>

## MCP クライアントレジストリとしての OpenClaw

これは `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload`、および `unset` のパスです。

これらのコマンドは、MCP を介して OpenClaw を公開するものではありません。OpenClaw 設定内の `mcp.servers` にある、OpenClaw が管理する MCP サーバー定義を管理します。`config/mcporter.json` から mcporter サーバーを読み取ることはありません。

保存されたこれらの定義は、組み込み OpenClaw やその他のランタイムアダプターなど、OpenClaw が後で起動または設定するランタイム向けです。OpenClaw は定義を一元的に保存するため、それらのランタイムが独自の重複した MCP サーバーリストを保持する必要はありません。

<AccordionGroup>
  <Accordion title="重要な動作">
    - これらのコマンドは OpenClaw 設定の読み取りまたは書き込みのみを行います
    - `status`、`list`、`show`、`--probe` を指定しない `doctor`、`set`、`configure`、`tools`、`logout`、`reload`、および `unset` は、対象の MCP サーバーに接続しません
    - `login` は、設定済みの HTTP サーバーに対して MCP OAuth ネットワークフローを実行し、生成されたローカル認証情報を保存します
    - `status --verbose` は、接続せずに、解決済みのトランスポート、認証、タイムアウト、フィルター、および並列ツール呼び出しのヒントを出力します
    - `doctor` は、stdio コマンドの欠落、無効な作業ディレクトリ、TLS ファイルの欠落、無効化されたサーバー、機密性の高いヘッダー／環境変数のリテラル値、不完全な OAuth 認可など、ローカル設定の問題について保存済み定義を検査します
    - `doctor --probe` は、静的チェックに合格した後、`probe` と同じライブ接続証明を追加します
    - `probe` は、選択したサーバーまたは設定済みの全サーバーに接続し、ツールを一覧表示して、機能／診断を報告します
    - `add` はフラグから定義を構築し、`--no-probe` が設定されている場合、または先に OAuth 認可が必要な場合を除き、保存前にプローブします
    - ランタイムアダプターは、実行時に実際にサポートするトランスポート形式を決定します
    - `enabled: false` はサーバーを保存したままにしますが、組み込みランタイムの検出対象から除外します
    - `timeout` と `connectTimeout` は、サーバーごとのリクエストタイムアウトと接続タイムアウトを秒単位で設定します
    - `supportsParallelToolCalls: true` は、アダプターが並行して呼び出せるサーバーを指定します
    - HTTP サーバーでは、静的ヘッダー、OAuth ログイン、TLS 検証制御、および mTLS 証明書／鍵のパスを使用できます
    - 組み込み OpenClaw は、通常の `coding` および `messaging` ツールプロファイルで、設定済み MCP ツールを公開します。`minimal` では引き続き非表示になり、`tools.deny: ["bundle-mcp"]` では明示的に無効化されます
    - サーバーごとの `toolFilter.include` と `toolFilter.exclude` は、検出された MCP ツールが OpenClaw ツールになる前にフィルタリングします
    - リソースまたはプロンプトを公開するサーバーは、リソースの一覧表示／読み取り、およびプロンプトの一覧表示／取得を行うユーティリティツールも公開します。生成されるこれらのユーティリティ名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）には、同じ包含／除外フィルターが使用されます
    - 動的な MCP ツールリストの変更により、そのセッションのキャッシュ済みカタログが無効になります。次回の検出／使用時にサーバーから更新されます
    - MCP ツールのリクエスト／プロトコル障害が繰り返されると、そのサーバーは短時間一時停止され、1 つの故障したサーバーがターン全体を消費しないようにします
    - セッションスコープの同梱 MCP ランタイムは、`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に破棄されます（デフォルトは 10 分。無効にするには `0` を設定）。また、単発の組み込み実行では実行終了時にクリーンアップされます

  </Accordion>
</AccordionGroup>

ランタイムアダプターは、この共有レジストリをダウンストリームクライアントが期待する形式へ正規化する場合があります。たとえば、組み込み OpenClaw は OpenClaw の `transport` 値を直接使用しますが、Claude Code と Gemini には `http`、`sse`、`stdio` など、CLI ネイティブの `type` 値が渡されます。

Codex app-server は、各サーバーの任意の `codex` ブロックにも従います。これは
Codex app-server スレッド専用の OpenClaw プロジェクションメタデータであり、ACP
セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターは変更しません。
空でない `codex.agents` を使用すると、特定の OpenClaw エージェント ID のみに
サーバーをプロジェクションできます。空、空白、または無効なエージェントリストは設定
検証によって拒否され、グローバルになる代わりにランタイムのプロジェクションパスから
除外されます。信頼済みサーバーに Codex ネイティブの `default_tools_approval_mode` を出力するには、
`codex.defaultToolsApprovalMode`（`auto`、`prompt`、または `approve`）を使用します。
OpenClaw は、ネイティブの `mcp_servers` 設定を Codex に渡す前に
`codex` メタデータを削除します。

### 保存済み MCP サーバー定義

コマンド：

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

注記：

- `list` はサーバー名を並べ替えます。
- 名前を指定しない `show` は、設定済みの MCP サーバーオブジェクト全体を出力します。
- `status` は、接続せずに設定済みトランスポートを分類します。`--verbose` には、解決済みの起動、タイムアウト、OAuth、フィルター、および並列呼び出しの詳細が含まれます。
- `doctor` は、接続せずに静的チェックを実行します。有効なサーバーに接続できることもコマンドで検証する場合は、`--probe` を追加します。
- `probe` は接続し、ツール数、リソース／プロンプトのサポート、リスト変更のサポート、および診断を報告します。
- `add` は、`--command`、`--arg`、`--env`、`--cwd` などの stdio フラグ、または `--url`、`--transport`、`--header`、`--auth oauth`、TLS、タイムアウト、ツール選択フラグなどの HTTP フラグを受け付けます。
- `set` は、コマンドライン上の 1 つの JSON オブジェクト値を必要とします。
- `configure` は、サーバー定義全体を置き換えずに、有効化状態、ツールフィルター、タイムアウト、OAuth、TLS、および並列ツール呼び出しのヒントを更新します。保存前に更新済みサーバーを検証するには、`--probe` を追加します。
- `tools` は、サーバーごとのツールフィルターを更新します。包含／除外エントリには、MCP ツール名と単純な `*` glob を指定します。
- `login` は、`auth: "oauth"` が設定された HTTP サーバーに対して OAuth フローを実行します。初回実行時に認可 URL が出力されます。承認後に `--code` を指定して再実行してください。
- `logout` は、保存済みサーバー定義を削除せずに、指定したサーバーの保存済み OAuth 認証情報を消去します。
- `reload` は、現在の CLI プロセスについてのみ、キャッシュされたインプロセス MCP ランタイムを破棄します。別のプロセス内の Gateway またはエージェントプロセスでは、それぞれ独自の再読み込みまたは再起動手順が必要です。
- Streamable HTTP MCP サーバーには `transport: "streamable-http"` を使用してください。`openclaw mcp set` は互換性のため、CLI ネイティブの `type: "http"` も同じ正規設定形式に正規化します。
- 指定したサーバーが存在しない場合、`unset` は失敗します。

例：

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### 一般的なサーバーレシピ

これらの例では、サーバー定義のみを保存します。その後、サーバーが起動してツールを公開することを確認するために `openclaw mcp doctor --probe` を実行してください。

<Tabs>
  <Tab title="ファイルシステム">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    ファイルシステムサーバーのスコープは、エージェントが読み取りまたは編集すべき最小限のディレクトリツリーに限定してください。

  </Tab>
  <Tab title="メモリ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    通常のエージェントに提供すべきでない書き込みツールをサーバーが公開する場合は、ツールフィルターを使用してください。

  </Tab>
  <Tab title="ローカルスクリプト">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` は、`cwd` が存在すること、および設定された環境からコマンドを解決できることを確認します。

  </Tab>
  <Tab title="リモート HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    リモートサーバーが対応している場合は OAuth を使用してください。サーバーに静的ヘッダーが必要な場合は、リテラルのベアラートークンをコミットしないでください。

  </Tab>
  <Tab title="デスクトップ/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    デスクトップを直接制御するサーバーは、起動元プロセスの権限を継承します。限定的なツールフィルターと OS レベルの権限プロンプトを使用してください。

  </Tab>
</Tabs>

### JSON 出力形式

スクリプトやダッシュボードには `--json` を使用してください。フィールドの集合は時間の経過とともに増える可能性があるため、利用側は未知のキーを無視する必要があります。

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth 認証情報が承認されていません。openclaw mcp login docs を実行してください"
            }
          ]
        }
      ]
    }
    ```

    有効になっている確認対象サーバーのいずれかに `error` レベルの問題がある場合、`doctor --json` はゼロ以外で終了します。`warning` および `info` の問題は報告されますが、それ自体ではコマンドは失敗しません。

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` はライブ MCP クライアントセッションを開き、その結果を直接出力します。`status`/`doctor` とは異なり、出力にはトップレベルの `path` フィールドがありません。`resources` および `prompts` キーは、サーバーが実際にその機能を通知している場合にのみ存在します（プロンプトのないサーバーは、`false` を報告するのではなく、`prompts` キーを省略します）。静的な設定監査ではなく、到達可能性と機能の確認には `probe` を使用してください。

  </Accordion>
</AccordionGroup>

設定形式の例：

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio トランスポート

ローカルの子プロセスを起動し、stdin/stdout を介して通信します。

| フィールド                      | 説明                       |
| -------------------------- | --------------------------------- |
| `command`                  | 起動する実行ファイル（必須）    |
| `args`                     | コマンドライン引数の配列   |
| `env`                      | 追加の環境変数       |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ |

<Warning>
**Stdio 環境変数の安全フィルター**

OpenClaw は、stdio MCP サーバーを起動する前に、インタープリター起動、ローダーハイジャック、シェル初期化に関する環境変数キーを拒否します。これは、サーバーの `env` ブロックに指定されている場合も同様です。他の OpenClaw が起動するプロセスと同じホスト環境セキュリティポリシーを使用し、既知のインタープリター起動フック（例：`NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共有ライブラリおよび関数インジェクションのプレフィックス（`DYLD_*`、`LD_*`、`BASH_FUNC_*`）、ならびに同様のランタイム制御変数をブロックします。起動時にこれらを通知なく削除し、警告をログに記録します。これにより、暗黙的な前処理の注入、インタープリターの差し替え、デバッガーの有効化、stdio プロセスに対する動的リンカーのハイジャックを防ぎます。明示的な許可リストにより、一般的な MCP 認証情報の環境変数（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`）に加えて、通常のプロキシおよびサーバー固有の環境変数（`HTTP_PROXY`、カスタムの `*_API_KEY` など）も引き続き使用できます。`AWS_CONFIG_FILE` や `AWS_SHARED_CREDENTIALS_FILE` など、その他の `AWS_*` キーは、認証情報の値を直接保持するのではなく認証情報ファイルを指すため、引き続きブロックされます。

MCP サーバーでブロック対象の変数が本当に必要な場合は、stdio サーバーの `env` の下ではなく、Gateway ホストプロセスに設定してください。
</Warning>

### SSE / HTTP トランスポート

HTTP Server-Sent Events を介してリモート MCP サーバーに接続します。

| フィールド                          | 説明                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | リモートサーバーの HTTP または HTTPS URL（必須）                |
| `headers`                      | HTTP ヘッダーのオプションのキーと値のマップ（例：認証トークン） |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト（ミリ秒、任意）                   |
| `connectTimeout`               | サーバーごとの接続タイムアウト（秒、任意）              |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）                  |
| `auth: "oauth"`                | `openclaw mcp login` で保存した MCP OAuth 認証情報を使用する          |
| `sslVerify`                    | 明示的に信頼されたプライベート HTTPS エンドポイントの場合にのみ false に設定する    |
| `clientCert` / `clientKey`     | mTLS クライアント証明書および秘密鍵のパス                            |
| `supportsParallelToolCalls`    | このサーバーでは同時呼び出しが安全であることを示すヒント              |

例：

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

`url`（ユーザー情報）および `headers` 内の機密値は、ログとステータス出力でマスクされます。機密情報と思われる `headers` または `env` のエントリにリテラル値が含まれている場合、`openclaw mcp doctor` は警告を表示し、運用者がそれらの値をコミット済み設定の外へ移動できるようにします。

### OAuth ワークフロー

OAuth は、MCP OAuth フローを通知する HTTP MCP サーバー向けです。`auth: "oauth"` が有効な間、そのサーバーでは静的な `Authorization` ヘッダーは無視されます。`openclaw mcp login` で保存した認証情報は、組み込み MCP、CLI ランナー、ローカルの Codex アプリサーバーで使用できます。

認証情報を利用できるようになるまで、OpenClaw はエージェントのターンを失敗させる代わりに、その MCP サーバーのみをエージェントランタイムから除外します。その後、運用者またはシェルアクセス権を持つエージェントが `openclaw mcp login <name>` を実行し、後続のターンでサーバーを使用できます。

リモート MCP サービスが、更新機能を備えた別の OpenClaw 認証プロファイルによってすでに支えられている場合は、必要に応じて `oauth.authProfileId` を設定できます。OpenClaw はランタイムへの投影前にいずれかの認証情報ソースを更新し、現在のアクセストークンのみを下流の MCP クライアントへ渡します。

<Steps>
  <Step title="サーバーを保存する">
    `auth: "oauth"` と任意の OAuth メタデータを使用して、サーバーを追加または更新します。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    認証プロファイルに基づくベアラーの場合は、プロファイルの関連付けを保存します。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="ログインを開始する">
    ログインを実行して認可リクエストを作成します。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw は認可 URL を出力し、一時的な OAuth 検証用状態を OpenClaw の状態ディレクトリに保存します。

  </Step>
  <Step title="コードで完了する">
    ブラウザーで承認した後、返されたコードを OpenClaw に渡します。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="認可を確認">
    status または doctor を使用して、トークンが存在することを確認します。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="認証情報を消去">
    ログアウトすると、保存されている OAuth 認証情報は削除されますが、保存済みのサーバー定義は維持されます。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

プロバイダーがトークンをローテーションした場合、または認可状態が停止した場合は、`openclaw mcp logout <name>` を実行してから、`login` を繰り返します。サーバー名と URL で認証情報ストアのエントリを引き続き識別できる限り、`auth: "oauth"` が設定から削除された後でも、`logout` で保存済み HTTP サーバーの認証情報を消去できます。

### ストリーム対応 HTTP トランスポート

`streamable-http` は、`sse` および `stdio` と並ぶ追加のトランスポートオプションです。リモート MCP サーバーとの双方向通信に HTTP ストリーミングを使用します。

| フィールド                     | 説明                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`             | リモートサーバーの HTTP または HTTPS URL（必須）                                       |
| `transport`             | このトランスポートを選択するには `"streamable-http"` に設定します。省略すると、OpenClaw は `sse` を使用します |
| `headers`             | HTTP ヘッダーのオプションのキーと値のマップ（認証トークンなど）                        |
| `connectionTimeoutMs`             | サーバーごとの接続タイムアウト（ms、任意）                                             |
| `connectTimeout`             | サーバーごとの接続タイムアウト（秒、任意）                                             |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト（秒または ms）                     |
| `auth: "oauth"`             | `openclaw mcp login` で保存された MCP OAuth 認証情報を使用します                          |
| `sslVerify`             | 明示的に信頼されたプライベート HTTPS エンドポイントの場合にのみ false に設定します     |
| `clientCert` / `clientKey` | mTLS クライアント証明書と鍵のパス                                             |
| `supportsParallelToolCalls`             | このサーバーで同時呼び出しが安全であることを示すヒント                                 |

OpenClaw の設定では、正規の表記として `transport: "streamable-http"` を使用します。CLI ネイティブの MCP `type: "http"` 値は、`openclaw mcp set` を介して保存すると受け入れられ、既存の設定では `openclaw doctor --fix` によって修復されますが、組み込みの OpenClaw が直接使用するのは `transport` です。

例:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
レジストリコマンドはチャネルブリッジを起動しません。ターゲットサーバーに到達できることを証明するためにライブ MCP クライアントセッションを開くのは、`probe` と `doctor --probe` のみです。
</Note>

## Control UI

ブラウザーの Control UI には、`/settings/mcp` に専用の MCP 設定ページがあります。以前の `/mcp` パスはエイリアスとして引き続き使用できます。このページには、設定済みサーバー数、有効化/OAuth/フィルターの概要、サーバーごとのトランスポート行、有効化/無効化コントロール、一般的な CLI コマンド、および `mcp` 設定セクション用のスコープ付きエディターが表示されます。

このページは、オペレーターによる編集や簡単な一覧確認に使用します。ライブサーバーの証明が必要な場合は、`openclaw mcp doctor --probe` または `openclaw mcp probe` を使用します。

オペレーターのワークフロー:

1. Control UI を開き、**MCP** を選択します。
2. サーバーの総数、有効、OAuth、フィルター適用済みの概要カードを確認します。
3. 各サーバー行で、トランスポート、認証、フィルター、タイムアウト、コマンドのヒントを確認します。
4. 定義を維持しながらランタイム検出から除外する場合は、有効化状態を切り替えます。
5. 新しいサーバー、ヘッダー、TLS、OAuth メタデータ、ツールフィルターなどの構造的な変更には、スコープ付きの `mcp` 設定セクションを編集します。
6. 設定のみを永続化するには **Save**、Gateway の設定パスを介して適用するには **Save & Publish** を選択します。
7. 編集したサーバーが起動してツールを一覧表示することのライブ証明が必要な場合は、`openclaw mcp doctor --probe` を実行します。

注:

- コマンドスニペットではサーバー名を引用符で囲むため、通常とは異なる名前でもシェルにコピーできます
- 表示される URL 形式の値に認証情報が埋め込まれている場合、レンダリング前に秘匿化されます
- このページ自体は MCP トランスポートを起動しません
- MCP クライアントを所有するプロセスに応じて、アクティブなランタイムでは `openclaw mcp reload`、Gateway 設定の公開、またはプロセスの再起動が必要になる場合があります

## MCP Apps

OpenClaw は、安定版の [MCP Apps 拡張機能](https://modelcontextprotocol.io/extensions/apps)を実装するツールをレンダリングできます。Apps の HTML は設定済みの MCP サーバーから提供され、同じサーバーのアプリ可視ツールやリソースを要求できるため、Apps はオプトインです。

ホストブリッジを有効にします:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

この設定を変更した後は、Gateway を再起動します。有効にすると、OpenClaw は Gateway ポートに 1 を加えたポート（デフォルトの Gateway では `18790`）で、サンドボックス専用の HTTP(S) リスナーを起動します。Control UI はこの別オリジンから Apps を読み込みます。このリスナーが Control UI、認証済み Gateway ルート、またはユーザーデータを提供することはありません。

Gateway への直接接続では、両方のポートにアクセスできる必要があります。リバースプロキシまたは TLS ターミネーターで Control UI を公開する場合は、Apps に専用の公開オリジンを割り当て、そのオリジンのみをサンドボックスリスナーにプロキシします:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

サンドボックスのオリジンは Control UI のオリジンと異なる必要があります。その他の認証済みコンテンツや機密コンテンツをそのオリジンでホストしないでください。

たとえば、公式の基本 React デモは次のように設定できます:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

動作とセキュリティ境界:

- OpenClaw は、Apps が有効な場合にのみ `io.modelcontextprotocol/ui` 拡張機能を通知します。
- 正確に `text/html;profile=mcp-app` MIME タイプを持つ `ui://` リソースのみがレンダリングされます。
- UI リソースは 2 MiB に制限され、専用の外部オリジン上にある二重 iframe プロキシの背後に配置され、不透明な内部 App オリジンに読み込まれ、リソースメタデータから生成された CSP によって制約されます。
- App 専用ツール（`_meta.ui.visibility: ["app"]`）はモデルのツール一覧には含まれません。Apps が呼び出せるのは、ビューを作成した実行に適用される OpenClaw の有効なツールポリシーにも合格する、所有元サーバー上のアプリ可視ツールのみです。
- App 間の分離のために内部 App ドキュメントが不透明なオリジンを使用している間は、カメラ、マイク、位置情報などのオリジンに紐づく App 権限は付与されません。
- App の HTML、完全なツール引数、生の結果は、上限が設定された 10 分間のメモリ内ビューリースに保持され、ディスクへの書き込みやトランスクリプトのプレビューメタデータへのコピーは行われません。トランスクリプトには、元のツール呼び出し ID に紐づけられた、上限付きのサーバー/ツール/リソース記述子のみが保存されます。Gateway の再起動後、Control UI は認証済みセッションのトランスクリプトに照らしてその記述子を検証し、`ui://` リソースを再取得できます。再構築されたビューは、新しい実行によって現在のツール権限が確立されるまで読み取り専用です。
- ブリッジが有効な間、`openclaw security audit` は警告を表示します。不要な場合は、`openclaw config set mcp.apps.enabled false --strict-json` で無効にします。

## 現在の制限

このページでは、現在リリースされているブリッジについて説明します。

現在の制限:

- 会話の検出は、既存の Gateway セッションルートメタデータに依存します
- Claude 固有のアダプターを除き、汎用プッシュプロトコルはありません
- メッセージの編集ツールやリアクションツールはまだありません
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続します。多重化されたアップストリームはまだありません
- `permissions_list_open` には、ブリッジの接続中に確認された承認のみが含まれます

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Plugins](/ja-JP/cli/plugins)
