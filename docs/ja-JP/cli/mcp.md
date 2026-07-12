---
read_when:
    - Codex、Claude Code、または別の MCP クライアントを OpenClaw を基盤とするチャネルに接続する
    - '`openclaw mcp serve` を実行中'
    - OpenClaw に保存された MCP サーバー定義の管理
sidebarTitle: MCP
summary: MCP 経由で OpenClaw のチャンネル会話を公開し、保存済みの MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-07-12T14:22:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` には 2 つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload`、`unset` を使用して、OpenClaw が管理する送信先 MCP サーバー定義を管理する

`serve` では、OpenClaw が MCP サーバーとして動作します。その他のサブコマンドでは、OpenClaw 自身のランタイムが後で利用できるサーバーのための、MCP クライアント側レジストリとして動作します。

<Note>
  `list`、`show`、`set`、`unset` は、OpenClaw 設定内の OpenClaw が管理する `mcp.servers` エントリのみを読み書きします。`config/mcporter.json` の mcporter サーバーは含まれません。そのレジストリには `mcporter list` を使用してください。
</Note>

OpenClaw 自身がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## 適切な MCP パスを選択する

| 目的                                                                | 使用するもの                                                                  | 理由                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 外部 MCP クライアントから OpenClaw チャネルの会話を読み取り、送信できるようにする | `openclaw mcp serve`                                                 | OpenClaw が MCP サーバーとなり、Gateway を基盤とする会話を stdio 経由で公開します。                                 |
| OpenClaw が管理するエージェント実行用にサードパーティ MCP サーバーを保存する        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw が MCP クライアント側レジストリとなり、後でそれらのサーバーを対象ランタイムに反映します。               |
| エージェントターンを実行せずに保存済みサーバーを確認する                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` と `doctor` は設定を検査し、`probe` は実際の MCP 接続を開いて機能を一覧表示します。               |
| ブラウザーから MCP 設定を編集する                                      | Control UI `/settings/mcp`（`/mcp` エイリアス）                            | このページには、インベントリ、有効化状態、OAuth/フィルターの概要、コマンドのヒント、スコープ付き `mcp` エディターが表示されます。         |
| Codex app-server にスコープ付きネイティブ MCP サーバーを提供する                    | `mcp.servers.<name>.codex`                                           | `codex` ブロックは Codex app-server のスレッド反映にのみ影響し、ネイティブ設定への引き渡し前に除去されます。 |
| ACP がホストするハーネスセッションを実行する                                     | [`openclaw acp`](/ja-JP/cli/acp) と [ACP エージェント](/ja-JP/tools/acp-agents-setup) | ACP ブリッジモードはセッションごとの MCP サーバー注入を受け付けません。代わりに Gateway/Plugin ブリッジを設定してください。     |

<Tip>
必要なパスがわからない場合は、まず `openclaw mcp status --verbose` を実行してください。MCP サーバーを起動せずに、OpenClaw に保存されている内容を表示します。
</Tip>

## MCP サーバーとしての OpenClaw

これは `openclaw mcp serve` のパスです。

### serve を使用する場合

次の場合に `openclaw mcp serve` を使用します。

- Codex、Claude Code、または別の MCP クライアントから、OpenClaw を基盤とするチャネルの会話を直接利用する場合
- ルーティング済みセッションを持つローカルまたはリモートの OpenClaw Gateway がすでにある場合
- チャネルごとに個別のブリッジを実行する代わりに、OpenClaw の複数のチャネルバックエンドで動作する 1 つの MCP サーバーが必要な場合

OpenClaw 自身がコーディングランタイムをホストし、エージェントセッションを OpenClaw 内に維持する場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

### 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。そのプロセスは MCP クライアントが所有します。クライアントが stdio セッションを開いたままにしている間、ブリッジは WebSocket 経由でローカルまたはリモートの OpenClaw Gateway に接続し、ルーティングされたチャネルの会話を MCP 経由で公開します。

<Steps>
  <Step title="クライアントがブリッジを起動">
    MCP クライアントが `openclaw mcp serve` を起動します。
  </Step>
  <Step title="ブリッジが Gateway に接続">
    ブリッジが WebSocket 経由で OpenClaw Gateway に接続します。
  </Step>
  <Step title="セッションが MCP の会話になる">
    ルーティングされたセッションが MCP の会話およびトランスクリプト/履歴ツールになります。
  </Step>
  <Step title="ライブイベントをキューに格納">
    ブリッジの接続中、ライブイベントはメモリ内のキューに格納されます。
  </Step>
  <Step title="任意の Claude プッシュ">
    Claude チャネルモードが有効な場合、同じセッションで Claude 固有のプッシュ通知も受信できます。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要な動作">
    - ライブキューの状態はブリッジの接続時に開始されます
    - 過去のトランスクリプト履歴は `messages_read` で読み取ります
    - Claude プッシュ通知は MCP セッションが有効な間だけ存在します
    - クライアントが切断すると、ブリッジは終了し、ライブキューは失われます
    - `openclaw agent` や `openclaw infer model run` などの単発エージェントエントリポイントは、応答が完了すると、それらが開いたバンドル MCP ランタイムを終了します。そのため、スクリプトによる反復実行で stdio MCP 子プロセスが蓄積することはありません
    - OpenClaw によって起動された stdio MCP サーバー（バンドルまたはユーザー設定）は、シャットダウン時にプロセスツリーとして終了されるため、サーバーによって起動された子サブプロセスが、親 stdio クライアントの終了後も残ることはありません
    - セッションを削除またはリセットすると、共有ランタイムのクリーンアップパスを通じて、そのセッションの MCP クライアントが破棄されるため、削除されたセッションに関連付けられた stdio 接続が残ることはありません

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
現在、`auto` は `on` と同じように動作します。クライアント機能の検出はまだありません。
</Note>

### serve が公開するもの

ブリッジは既存の Gateway セッションルートメタデータを使用して、チャネルを基盤とする会話を公開します。OpenClaw に次のような既知のルートを持つセッション状態がすでにある場合、会話が表示されます。

- `channel`
- 受信者または宛先のメタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは 1 か所で次のことができます。

- 最近ルーティングされた会話を一覧表示する
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
  <Tab title="詳細出力 / Claude 無効">
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

    フィルター: `limit`（最大 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    Gateway セッションの直接検索を使用して、`session_key` に対応する 1 つの会話を返します。
  </Accordion>
  <Accordion title="messages_read">
    1 つのセッションベースの会話について、最近のトランスクリプトメッセージを読み取ります。`limit` のデフォルトは 20、最大は 200 です。
  </Accordion>
  <Accordion title="attachments_fetch">
    1 つのトランスクリプトメッセージから非テキストのメッセージコンテンツブロックを抽出します。これはトランスクリプト内容のメタデータビューであり、独立した永続的な添付ファイルの BLOB ストアではありません。
  </Accordion>
  <Accordion title="events_poll">
    数値カーソル以降の、キューに格納されたライブイベントを読み取ります。`limit` の最大は 200 です。
  </Accordion>
  <Accordion title="events_wait">
    次に一致するキュー内イベントが到着するか、タイムアウトするまでロングポーリングします（デフォルト 30s、最大 300s）。

    汎用 MCP クライアントで、Claude 固有のプッシュプロトコルを使用せずにほぼリアルタイムの配信が必要な場合に使用します。

  </Accordion>
  <Accordion title="messages_send">
    セッションにすでに記録されている同じルートを通じてテキストを送り返します。

    現在の動作:

    - 既存の会話ルートが必要です
    - セッションのチャネル、受信者、アカウント ID、スレッド ID を使用します
    - テキストのみを送信します

  </Accordion>
  <Accordion title="permissions_list_open">
    ブリッジが Gateway に接続して以降に検出した、保留中の exec/Plugin 承認リクエストを一覧表示します。
  </Accordion>
  <Accordion title="permissions_respond">
    保留中の exec/Plugin 承認リクエスト 1 件を、次のいずれかで解決します。

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
- `events_poll` と `events_wait` は、それ自体では過去の Gateway 履歴を再生しません
- 永続的なバックログは `messages_read` で読み取る必要があります

</Warning>

### Claude チャネル通知

ブリッジは Claude 固有のチャネル通知も公開できます。これは Claude Code チャネルアダプターに相当する OpenClaw の機能です。標準 MCP ツールは引き続き利用できますが、ライブの受信メッセージを Claude 固有の MCP 通知として受信することもできます。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 標準 MCP ツールのみです。
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
- リンクされた会話のコマンド所有者が後で `yes <id>` または `no <id>`（`<id>` は `l` を除く 5 文字のリクエスト ID）を送信すると、ブリッジはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブセッション専用です。MCP クライアントが切断すると、プッシュ先はなくなります

これは意図的にクライアント固有となっています。汎用 MCP クライアントは標準のポーリングツールを使用してください。

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

`openclaw mcp serve` は次をサポートします。

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
  Claude 通知モード。デフォルトは `auto`。
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  stderr に詳細ログを出力します。
</ParamField>

<Tip>
可能な場合は、シークレットをインラインで指定せず、`--token-file` または `--password-file` を使用してください。
</Tip>

### セキュリティと信頼境界

ブリッジがルーティングを独自に作り出すことはありません。Gateway がすでにルーティング可能な会話のみを公開します。

つまり、次のことを意味します。

- 送信者の許可リスト、ペアリング、チャネルレベルの信頼は、引き続き基盤となる OpenClaw チャネル設定に属します
- `messages_send` は、保存済みの既存ルートを介してのみ返信できます
- 承認状態は、現在のブリッジセッションにおけるライブなインメモリ状態のみです
- ブリッジ認証には、他のリモート Gateway クライアントと同様に信頼できる Gateway トークンまたはパスワード制御を使用してください

会話が `conversations_list` に表示されない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションのルートメタデータが欠落しているか、不完全であることが原因です。

### テスト

OpenClaw には、このブリッジ用の決定論的な Docker スモークテストが含まれています。

```bash
pnpm test:docker:mcp-channels
```

このスモークテストは単一のコンテナで実行されます。会話状態をシードし、Gateway を起動した後、`openclaw mcp serve` を stdio 子プロセスとして生成し、MCP クライアントとして操作します。実際の stdio MCP ブリッジを介して、会話の検出、トランスクリプトの読み取り、添付ファイルメタデータの読み取り、ライブイベントキューの動作、Claude 形式のチャネル通知および権限通知を検証します。送信ルーティング（保存済みの会話ルートを再利用する `messages_send`）は、`src/mcp/channel-server.test.ts` のユニットテストで個別に検証されます。

これは、実際の Telegram、Discord、iMessage アカウントをテスト実行に組み込まずに、ブリッジが動作することを証明する最速の方法です。

より広範なテストの背景については、[テスト](/ja-JP/help/testing)を参照してください。

### トラブルシューティング

<AccordionGroup>
  <Accordion title="会話が返されない">
    通常、Gateway セッションがまだルーティング可能になっていないことを意味します。基盤となるセッションに、保存済みのチャネル／プロバイダー、受信者、および任意のアカウント／スレッドのルートメタデータがあることを確認してください。
  </Accordion>
  <Accordion title="events_poll または events_wait で古いメッセージを取得できない">
    想定どおりの動作です。ライブキューはブリッジの接続時に開始されます。古いトランスクリプト履歴は `messages_read` で読み取ってください。
  </Accordion>
  <Accordion title="Claude 通知が表示されない">
    次のすべてを確認してください。

    - クライアントが stdio MCP セッションを開いたままにしている
    - `--claude-channel-mode` が `on` または `auto` である
    - クライアントが Claude 固有の通知メソッドを実際に認識する
    - 受信メッセージがブリッジ接続後に発生した

  </Accordion>
  <Accordion title="承認が表示されない">
    `permissions_list_open` に表示されるのは、ブリッジの接続中に観測された承認リクエストのみです。これは永続的な承認履歴 API ではありません。
  </Accordion>
</AccordionGroup>

## MCP クライアントレジストリとしての OpenClaw

これは、`openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload`、`unset` のパスです。

これらのコマンドは、OpenClaw を MCP 経由で公開するものではありません。OpenClaw 設定の `mcp.servers` にある、OpenClaw が管理する MCP サーバー定義を管理します。`config/mcporter.json` から mcporter サーバーを読み取ることはありません。

保存されたこれらの定義は、組み込み OpenClaw やその他のランタイムアダプターなど、OpenClaw が後で起動または設定するランタイム向けです。OpenClaw は定義を一元的に保存するため、各ランタイムが独自に重複した MCP サーバー一覧を保持する必要はありません。

<AccordionGroup>
  <Accordion title="重要な動作">
    - これらのコマンドは OpenClaw 設定の読み取りまたは書き込みのみを行います
    - `status`、`list`、`show`、`--probe` なしの `doctor`、`set`、`configure`、`tools`、`logout`、`reload`、`unset` は、対象の MCP サーバーに接続しません
    - `login` は、設定済みの HTTP サーバーに対して MCP OAuth ネットワークフローを実行し、取得したローカル認証情報を保存します
    - `status --verbose` は接続せずに、解決済みのトランスポート、認証、タイムアウト、フィルター、並列ツール呼び出しのヒントを出力します
    - `doctor` は、stdio コマンドの欠落、無効な作業ディレクトリ、TLS ファイルの欠落、無効化されたサーバー、機密性の高いヘッダー／環境変数のリテラル値、不完全な OAuth 認可など、保存済み定義におけるローカルセットアップの問題を確認します
    - `doctor --probe` は、静的チェックの通過後に `probe` と同じライブ接続証明を追加します
    - `probe` は選択したサーバーまたは設定済みのすべてのサーバーに接続し、ツールを一覧表示して、機能／診断を報告します
    - `add` はフラグから定義を構築し、`--no-probe` が設定されている場合または先に OAuth 認可が必要な場合を除き、保存前にプローブします
    - ランタイムアダプターは、実行時に実際にサポートするトランスポート形式を決定します
    - `enabled: false` はサーバーを保存したままにしますが、組み込みランタイムの検出対象から除外します
    - `timeout` と `connectTimeout` は、サーバーごとのリクエストおよび接続タイムアウトを秒単位で設定します
    - `supportsParallelToolCalls: true` は、アダプターが並行して呼び出せるサーバーであることを示します
    - HTTP サーバーでは、静的ヘッダー、OAuth ログイン、TLS 検証制御、mTLS 証明書／キーパスを使用できます
    - 組み込み OpenClaw は、通常の `coding` および `messaging` ツールプロファイルで設定済み MCP ツールを公開します。`minimal` では引き続き非表示になり、`tools.deny: ["bundle-mcp"]` で明示的に無効化できます
    - サーバーごとの `toolFilter.include` と `toolFilter.exclude` は、検出された MCP ツールが OpenClaw ツールになる前にフィルタリングします
    - リソースまたはプロンプトを通知するサーバーは、リソースの一覧表示／読み取り、およびプロンプトの一覧表示／取得を行うユーティリティツールも公開します。生成されるこれらのユーティリティ名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）には、同じ include/exclude フィルターが適用されます
    - MCP ツール一覧の動的な変更により、そのセッションのキャッシュ済みカタログが無効になります。次回の検出／使用時にサーバーから更新されます
    - MCP ツールのリクエスト／プロトコル障害が繰り返されると、そのサーバーは一時停止されるため、1 台の故障したサーバーがターン全体を消費することはありません
    - セッションスコープのバンドル済み MCP ランタイムは、`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます（デフォルトは 10 分。無効にするには `0` を設定）。単発の組み込み実行では、実行終了時にクリーンアップされます

  </Accordion>
</AccordionGroup>

ランタイムアダプターは、この共有レジストリを下流クライアントが想定する形式に正規化する場合があります。たとえば、組み込み OpenClaw は OpenClaw の `transport` 値を直接使用しますが、Claude Code と Gemini には `http`、`sse`、`stdio` などの CLI ネイティブな `type` 値が渡されます。

Codex app-server は、各サーバーの任意の `codex` ブロックにも対応します。これは
Codex app-server スレッド専用の OpenClaw プロジェクションメタデータであり、
ACP セッション、汎用 Codex ハーネス設定、その他のランタイムアダプターは
変更しません。空でない `codex.agents` を使用すると、特定の OpenClaw
エージェント ID のみにサーバーをプロジェクションできます。空、空白、または無効なエージェント一覧は、グローバルになるのではなく、設定
検証で拒否され、ランタイムのプロジェクションパスから除外されます。
信頼済みサーバーに Codex ネイティブの `default_tools_approval_mode` を
出力するには、`codex.defaultToolsApprovalMode`（`auto`、`prompt`、`approve`）
を使用します。OpenClaw は、ネイティブの `mcp_servers` 設定を Codex に
渡す前に `codex` メタデータを削除します。

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
- 名前を指定しない `show` は、設定済み MCP サーバーオブジェクト全体を出力します。
- `status` は接続せずに、設定済みのトランスポートを分類します。`--verbose` を指定すると、解決済みの起動、タイムアウト、OAuth、フィルター、並列呼び出しの詳細も含まれます。
- `doctor` は接続せずに静的チェックを実行します。有効なサーバーに接続できることもコマンドで検証する場合は、`--probe` を追加します。
- `probe` は接続し、ツール数、リソース／プロンプトのサポート、一覧変更のサポート、診断を報告します。
- `add` は、`--command`、`--arg`、`--env`、`--cwd` などの stdio フラグ、または `--url`、`--transport`、`--header`、`--auth oauth`、TLS、タイムアウト、ツール選択フラグなどの HTTP フラグを受け付けます。
- `set` は、コマンドライン上で 1 つの JSON オブジェクト値を必要とします。
- `configure` は、サーバー定義全体を置き換えずに、有効化状態、ツールフィルター、タイムアウト、OAuth、TLS、並列ツール呼び出しのヒントを更新します。保存前に更新後のサーバーを検証するには、`--probe` を追加します。
- `tools` はサーバーごとのツールフィルターを更新します。include/exclude の各エントリには、MCP ツール名および単純な `*` グロブを指定します。
- `login` は、`auth: "oauth"` で設定された HTTP サーバーの OAuth フローを実行します。初回実行時に認可 URL が出力されます。承認後に `--code` を指定して再実行してください。
- `logout` は、保存済みのサーバー定義を削除せずに、指定したサーバーの保存済み OAuth 認証情報を消去します。
- `reload` は、現在の CLI プロセスにおけるキャッシュ済みのインプロセス MCP ランタイムのみを破棄します。別のプロセスにある Gateway またはエージェントプロセスでは、引き続き独自の再読み込みまたは再起動パスが必要です。
- Streamable HTTP MCP サーバーには `transport: "streamable-http"` を使用します。`openclaw mcp set` は互換性のため、CLI ネイティブの `type: "http"` も同じ正規設定形式に正規化します。
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

### 一般的なサーバー設定例

これらの例は、サーバー定義のみを保存します。その後、`openclaw mcp doctor --probe` を実行して、サーバーが起動し、ツールを公開することを証明してください。

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

    ファイルシステムサーバーのスコープは、エージェントが読み取りまたは編集する必要がある最小限のディレクトリツリーに限定してください。

  </Tab>
  <Tab title="メモリ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    通常のエージェントが使用すべきでない書き込みツールをサーバーが公開する場合は、ツールフィルターを使用してください。

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

    リモートサーバーが対応している場合は OAuth を使用します。サーバーが静的ヘッダーを必要とする場合は、リテラルのベアラートークンをコミットしないでください。

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

スクリプトやダッシュボードでは `--json` を使用します。フィールドの集合は時間の経過とともに増える可能性があるため、利用側は未知のキーを無視する必要があります。

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

    有効で検査対象のサーバーに `error` レベルの問題が 1 つでもある場合、`doctor --json` は 0 以外で終了します。`warning` と `info` の問題は報告されますが、それ自体でコマンドが失敗することはありません。

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

    `probe --json` はライブ MCP クライアントセッションを開始し、その結果を直接出力します。`status`/`doctor` とは異なり、出力にはトップレベルの `path` フィールドがありません。`resources` キーと `prompts` キーは、サーバーが実際にその機能を公開している場合にのみ存在します（プロンプトに対応していないサーバーは、`false` を報告するのではなく `prompts` キーを省略します）。静的な設定監査ではなく、到達可能性と機能の証明には `probe` を使用してください。

  </Accordion>
</AccordionGroup>

設定形式の例:

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

ローカルの子プロセスを起動し、stdin/stdout 経由で通信します。

| フィールド                   | 説明                               |
| -------------------------- | --------------------------------- |
| `command`                  | 起動する実行可能ファイル（必須）         |
| `args`                     | コマンドライン引数の配列                 |
| `env`                      | 追加の環境変数                         |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ               |

<Warning>
**Stdio 環境変数の安全フィルター**

OpenClaw は、stdio MCP サーバーを起動する前に、インタープリターの起動、ローダーの乗っ取り、シェル初期化に関わる環境変数キーを拒否します。これは、そのキーがサーバーの `env` ブロックに含まれている場合も同様です。この処理では、OpenClaw が起動する他のプロセスと同じホスト環境セキュリティポリシーを使用します。既知のインタープリター起動フック（たとえば `NODE_OPTIONS`、`PYTHONSTARTUP`、`PERL5OPT`、`RUBYOPT`、`BASHOPTS`、`KSH_ENV`）、共有ライブラリおよび関数インジェクション用のプレフィックス（`DYLD_*`、`LD_*`、`BASH_FUNC_*`）、ならびに同様のランタイム制御変数をブロックします。起動時にこれらは通知なく削除され、警告がログに記録されます。これにより、stdio プロセスに対する暗黙的な前処理の挿入、インタープリターの差し替え、デバッガーの有効化、動的リンカーの乗っ取りを防ぎます。明示的な許可リストにより、通常の MCP 認証情報用環境変数（`GITHUB_TOKEN`、`GH_TOKEN`、`GITLAB_TOKEN`、`NPM_TOKEN`、`NODE_AUTH_TOKEN`、`DATABASE_URL`、`MONGODB_URI`、`REDIS_URL`、`AMQP_URL`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、`AWS_SESSION_TOKEN`、`AZURE_CLIENT_ID`、`AZURE_CLIENT_SECRET`）に加え、通常のプロキシおよびサーバー固有の環境変数（`HTTP_PROXY`、カスタムの `*_API_KEY` など）は引き続き使用できます。`AWS_CONFIG_FILE` や `AWS_SHARED_CREDENTIALS_FILE` など、その他の `AWS_*` キーは、認証情報の値を直接保持するのではなく認証情報ファイルを指すため、引き続きブロックされます。

MCP サーバーでブロック対象の変数が本当に必要な場合は、stdio サーバーの `env` 配下ではなく、Gateway ホストプロセスに設定してください。
</Warning>

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| フィールド                       | 説明                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `url`                          | リモートサーバーの HTTP または HTTPS URL（必須）                         |
| `headers`                      | HTTP ヘッダーの任意のキーと値のマップ（認証トークンなど）                    |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト（ミリ秒、任意）                              |
| `connectTimeout`               | サーバーごとの接続タイムアウト（秒、任意）                                 |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）                   |
| `auth: "oauth"`                | `openclaw mcp login` で保存した MCP OAuth 認証情報を使用                    |
| `sslVerify`                    | 明示的に信頼するプライベート HTTPS エンドポイントの場合にのみ false に設定     |
| `clientCert` / `clientKey`     | mTLS クライアント証明書と鍵のパス                                        |
| `supportsParallelToolCalls`    | このサーバーでは並行呼び出しが安全であることを示すヒント                       |

例:

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

`url` 内の機密値（ユーザー情報）と `headers` は、ログおよびステータス出力で秘匿化されます。機密情報と思われる `headers` または `env` の項目にリテラル値が含まれている場合、`openclaw mcp doctor` は警告を表示し、運用者がそれらの値をコミット済みの設定から移動できるようにします。

### OAuth ワークフロー

OAuth は、MCP OAuth フローを公開する HTTP MCP サーバー向けです。`auth: "oauth"` が有効な間、そのサーバーでは静的な `Authorization` ヘッダーは無視されます。`openclaw mcp login` で保存した認証情報は、組み込み MCP、CLI ランナー、ローカルの Codex app-server で使用できます。

認証情報が利用可能になるまで、OpenClaw はエージェントのターンを失敗させるのではなく、その MCP サーバーのみをエージェントランタイムから除外します。その後、運用者またはシェルアクセス権を持つエージェントが `openclaw mcp login <name>` を実行し、後続のターンでサーバーを使用できます。

リモート MCP サービスが、更新可能な別の OpenClaw 認証プロファイルによってすでに支えられている場合は、必要に応じて `oauth.authProfileId` を設定できます。OpenClaw はランタイムへの投影前にいずれかの認証情報ソースを更新し、現在のアクセストークンのみを下流の MCP クライアントに渡します。

<Steps>
  <Step title="サーバーを保存">
    `auth: "oauth"` と任意の OAuth メタデータを指定して、サーバーを追加または更新します。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    認証プロファイルに紐づくベアラーの場合は、プロファイルの関連付けを保存します。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="ログインを開始">
    ログインを実行して認可リクエストを作成します。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw は認可 URL を出力し、一時的な OAuth 検証用状態を OpenClaw の状態ディレクトリ配下に保存します。

  </Step>
  <Step title="コードで完了">
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
  <Step title="認証情報を削除">
    ログアウトすると、保存済みの OAuth 認証情報は削除されますが、保存済みのサーバー定義は維持されます。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

プロバイダーがトークンをローテーションした場合や認可状態が停止した場合は、`openclaw mcp logout <name>` を実行してから、`login` を繰り返してください。サーバー名と URL で認証情報ストアのエントリを引き続き識別できる限り、設定から `auth: "oauth"` を削除した後でも、`logout` は保存済み HTTP サーバーの認証情報を削除できます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` および `stdio` と並ぶ追加のトランスポートオプションです。HTTP ストリーミングを使用して、リモート MCP サーバーと双方向通信します。

| フィールド                     | 説明                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `url`                          | リモートサーバーの HTTP または HTTPS URL（必須）                                                       |
| `transport`                    | このトランスポートを選択するには `"streamable-http"` に設定します。省略すると、OpenClaw は `sse` を使用します |
| `headers`                      | HTTP ヘッダーのオプションのキーと値のマップ（認証トークンなど）                                       |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト（ミリ秒、オプション）                                                   |
| `connectTimeout`               | サーバーごとの接続タイムアウト（秒、オプション）                                                       |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）                                            |
| `auth: "oauth"`                | `openclaw mcp login` で保存された MCP OAuth 認証情報を使用します                                       |
| `sslVerify`                    | 明示的に信頼されたプライベート HTTPS エンドポイントの場合にのみ false に設定します                     |
| `clientCert` / `clientKey`     | mTLS クライアント証明書とキーのパス                                                                   |
| `supportsParallelToolCalls`    | このサーバーでは同時呼び出しが安全であることを示すヒント                                               |

OpenClaw の設定では、正式な表記として `transport: "streamable-http"` を使用します。CLI ネイティブの MCP `type: "http"` 値は、`openclaw mcp set` で保存する場合には受け入れられ、既存の設定では `openclaw doctor --fix` によって修復されますが、組み込みの OpenClaw が直接使用するのは `transport` です。

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
レジストリコマンドはチャネルブリッジを起動しません。ターゲットサーバーに到達可能であることを確認するために、稼働中の MCP クライアントセッションを開くのは `probe` と `doctor --probe` のみです。
</Note>

## Control UI

ブラウザの Control UI には、`/settings/mcp` に専用の MCP 設定ページがあります。以前の `/mcp` パスもエイリアスとして引き続き使用できます。このページには、設定済みサーバー数、有効化/OAuth/フィルターの概要、サーバーごとのトランスポート行、有効化/無効化コントロール、一般的な CLI コマンド、および `mcp` 設定セクション専用のエディターが表示されます。

運用者による編集や簡易的な一覧確認には、このページを使用します。稼働中のサーバーによる検証が必要な場合は、`openclaw mcp doctor --probe` または `openclaw mcp probe` を使用します。

運用者のワークフロー:

1. Control UI を開き、**MCP** を選択します。
2. 合計、有効、OAuth、フィルター済みサーバーの概要カードを確認します。
3. 各サーバー行で、トランスポート、認証、フィルター、タイムアウト、コマンドのヒントを確認します。
4. 定義を保持しつつランタイム検出から除外する場合は、有効化状態を切り替えます。
5. 新しいサーバー、ヘッダー、TLS、OAuth メタデータ、ツールフィルターなどの構造的な変更を行うには、専用の `mcp` 設定セクションを編集します。
6. 設定のみを保存するには **Save** を、Gateway の設定パスを通じて適用するには **Save & Publish** を選択します。
7. 編集したサーバーが起動してツールを一覧表示できることを実際に確認する必要がある場合は、`openclaw mcp doctor --probe` を実行します。

注:

- コマンドスニペットではサーバー名を引用符で囲むため、特殊な名前でもシェルにコピーできます
- 表示される URL 形式の値に認証情報が埋め込まれている場合、レンダリング前に秘匿化されます
- このページ自体は MCP トランスポートを起動しません
- MCP クライアントを所有するプロセスに応じて、稼働中のランタイムでは `openclaw mcp reload`、Gateway 設定の公開、またはプロセスの再起動が必要になる場合があります

## MCP Apps

OpenClaw は、安定版の [MCP Apps 拡張機能](https://modelcontextprotocol.io/extensions/apps)を実装するツールをレンダリングできます。Apps の HTML は設定済みの MCP サーバーから提供され、同じサーバーに対してアプリから参照可能なツールやリソースを要求できるため、Apps はオプトインです。

ホストブリッジを有効にします:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

この設定を変更した後は、Gateway を再起動します。有効にすると、OpenClaw は Gateway ポートに 1 を加えたポート（デフォルトの Gateway では `18790`）で、サンドボックス専用の HTTP(S) リスナーを起動します。Control UI はその別オリジンから Apps を読み込みます。このリスナーが Control UI、認証済みの Gateway ルート、またはユーザーデータを提供することはありません。

Gateway へ直接接続する場合は、両方のポートへのアクセスが必要です。リバースプロキシまたは TLS ターミネーターで Control UI を公開する場合は、Apps に専用のパブリックオリジンを割り当て、そのオリジンだけをサンドボックスリスナーへプロキシします:

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

サンドボックスのオリジンは Control UI のオリジンと異なる必要があります。そのオリジンで、認証済みのコンテンツや機密コンテンツをほかにホストしないでください。

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
- 正確に `text/html;profile=mcp-app` という MIME タイプを持つ `ui://` リソースのみがレンダリングされます。
- UI リソースは 2 MiB に制限され、専用の外側オリジンにある二重 iframe プロキシの背後に配置され、不透明な内側の App オリジンへ読み込まれ、リソースメタデータから生成された CSP によって制約されます。
- App 専用ツール（`_meta.ui.visibility: ["app"]`）はモデルのツール一覧に含まれません。Apps は、所有元サーバーにあるアプリから参照可能なツールのみを呼び出せます。
- App 間を分離するために内側の App ドキュメントが不透明オリジンを使用している間は、カメラ、マイク、位置情報など、オリジンに紐づく App 権限は付与されません。
- App HTML、完全なツール引数、生の結果は、上限が 10 分のメモリ内ビューリースに保持されます。これらがディスクに書き込まれたり、トランスクリプトのプレビューメタデータにコピーされたりすることはなく、ビューの有効期限が切れても MCP ランタイムは再起動されません。
- ブリッジが有効な間、`openclaw security audit` は警告を表示します。不要な場合は、`openclaw config set mcp.apps.enabled false --strict-json` で無効にします。

## 現在の制限

このページでは、現時点でリリースされているブリッジについて説明します。

現在の制限:

- 会話の検出は、既存の Gateway セッションルートのメタデータに依存します
- Claude 固有のアダプター以外に汎用プッシュプロトコルはありません
- メッセージの編集ツールやリアクションツールはまだありません
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続します。アップストリームの多重化にはまだ対応していません
- `permissions_list_open` には、ブリッジが接続されている間に確認された承認のみが含まれます

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [Plugin](/ja-JP/cli/plugins)
