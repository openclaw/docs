---
read_when:
    - OpenClaw がバックするチャネルに Codex、Claude Code、または別の MCP クライアントを接続する
    - 実行中 `openclaw mcp serve`
    - OpenClaw が保存した MCP サーバー定義の管理
sidebarTitle: MCP
summary: MCP 経由で OpenClaw チャネル会話を公開し、保存済み MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-07-05T11:08:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 569540aefe6700c82b00249183fd09e35ea41055a7e7fc0622a811bb2055488b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` には2つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload`、`unset` で、OpenClaw管理のアウトバウンド MCP サーバー定義を管理する

`serve` は、OpenClaw が MCP サーバーとして動作するものです。その他のサブコマンドは、OpenClaw 自身のランタイムが後で利用する可能性があるサーバー向けの MCP クライアント側レジストリとして OpenClaw が動作するものです。

<Note>
  `list`、`show`、`set`、`unset` は、OpenClaw 設定内の OpenClaw管理 `mcp.servers` エントリだけを読み書きします。`config/mcporter.json` の mcporter サーバーは含まれません。そのレジストリには `mcporter list` を使用してください。
</Note>

OpenClaw 自体がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする必要がある場合は、[`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## 適切な MCP パスを選ぶ

| 目的                                                                | 使用するもの                                                                  | 理由                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 外部 MCP クライアントに OpenClaw チャネル会話の読み取り/送信を許可する | `openclaw mcp serve`                                                 | OpenClaw が MCP サーバーになり、Gateway に支えられた会話を stdio 経由で公開します。                                 |
| OpenClaw管理のエージェント実行用にサードパーティ MCP サーバーを保存する        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw が MCP クライアント側レジストリになり、後で対象ランタイムへそれらのサーバーを投影します。               |
| エージェントターンを実行せずに保存済みサーバーを確認する                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` と `doctor` は設定を検査します。`probe` はライブ MCP 接続を開き、ケイパビリティを一覧表示します。               |
| ブラウザから MCP 設定を編集する                                      | Control UI `/mcp`                                                    | このページには、インベントリ、有効化状態、OAuth/フィルター概要、コマンドヒント、スコープ付き `mcp` エディターが表示されます。         |
| Codex app-server にスコープ付きネイティブ MCP サーバーを渡す                    | `mcp.servers.<name>.codex`                                           | `codex` ブロックは Codex app-server スレッド投影にのみ影響し、ネイティブ設定への引き渡し前に取り除かれます。 |
| ACPホストのハーネスセッションを実行する                                     | [`openclaw acp`](/ja-JP/cli/acp) と [ACP Agents](/ja-JP/tools/acp-agents-setup) | ACP ブリッジモードはセッション単位の MCP サーバー注入を受け付けません。代わりに gateway/plugin ブリッジを設定してください。     |

<Tip>
どのパスが必要かわからない場合は、`openclaw mcp status --verbose` から始めてください。MCP サーバーを起動せずに、OpenClaw に保存されている内容を表示します。
</Tip>

## MCP サーバーとしての OpenClaw

これは `openclaw mcp serve` のパスです。

### serve を使う場面

次の場合に `openclaw mcp serve` を使用します。

- Codex、Claude Code、または別の MCP クライアントが、OpenClaw に支えられたチャネル会話と直接やり取りする必要がある
- ルーティング済みセッションを持つローカルまたはリモートの OpenClaw Gateway がすでにある
- チャネルごとに個別のブリッジを実行する代わりに、OpenClaw のチャネルバックエンド全体で機能する1つの MCP サーバーが必要である

OpenClaw 自体がコーディングランタイムをホストし、エージェントセッションを OpenClaw 内に保持する必要がある場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

### 仕組み

`openclaw mcp serve` は stdio MCP サーバーを開始します。MCP クライアントがそのプロセスを所有します。クライアントが stdio セッションを開いたままにしている間、ブリッジは WebSocket 経由でローカルまたはリモートの OpenClaw Gateway に接続し、ルーティング済みチャネル会話を MCP 経由で公開します。

<Steps>
  <Step title="クライアントがブリッジを起動する">
    MCP クライアントが `openclaw mcp serve` を起動します。
  </Step>
  <Step title="ブリッジが Gateway に接続する">
    ブリッジが WebSocket 経由で OpenClaw Gateway に接続します。
  </Step>
  <Step title="セッションが MCP 会話になる">
    ルーティング済みセッションが MCP 会話とトランスクリプト/履歴ツールになります。
  </Step>
  <Step title="ライブイベントがキューに入る">
    ブリッジが接続されている間、ライブイベントはメモリ内にキューされます。
  </Step>
  <Step title="任意の Claude プッシュ">
    Claude チャネルモードが有効な場合、同じセッションは Claude 固有のプッシュ通知も受信できます。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要な動作">
    - ライブキュー状態はブリッジ接続時に開始します
    - 古いトランスクリプト履歴は `messages_read` で読み取ります
    - Claude プッシュ通知は MCP セッションが存続している間だけ存在します
    - クライアントが切断すると、ブリッジは終了し、ライブキューは失われます
    - `openclaw agent` や `openclaw infer model run` などの単発エージェントエントリポイントは、応答完了時に、それらが開いたバンドル済み MCP ランタイムをすべて終了するため、スクリプト化された反復実行で stdio MCP 子プロセスが蓄積されません
    - OpenClaw によって起動された stdio MCP サーバー（バンドル済みまたはユーザー設定）は、シャットダウン時にプロセスツリーとして終了されるため、サーバーが開始した子サブプロセスは親 stdio クライアント終了後に残りません
    - セッションを削除またはリセットすると、共有ランタイムクリーンアップパスを通じてそのセッションの MCP クライアントが破棄されるため、削除済みセッションに紐づく stdio 接続は残りません

  </Accordion>
</AccordionGroup>

### クライアントモードを選ぶ

<Tabs>
  <Tab title="汎用 MCP クライアント">
    標準 MCP ツールのみです。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、承認ツールを使用します。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP ツールに加えて、Claude 固有のチャネルアダプターを使用します。`--claude-channel-mode on` を有効にするか、デフォルトの `auto` のままにします。
  </Tab>
</Tabs>

<Note>
現在、`auto` は `on` と同じように動作します。クライアントケイパビリティ検出はまだありません。
</Note>

### serve が公開するもの

ブリッジは既存の Gateway セッションルートメタデータを使用して、チャネルに支えられた会話を公開します。OpenClaw に次のような既知のルートを持つセッション状態がすでにある場合、会話が表示されます。

- `channel`
- 受信者または宛先メタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは1か所で次のことができます。

- 最近のルーティング済み会話を一覧表示する
- 最近のトランスクリプト履歴を読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送り返す
- ブリッジ接続中に到着した承認リクエストを確認する

### 使い方

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
  <Tab title="詳細 / Claude オフ">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ブリッジツール

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway セッション状態にルートメタデータがすでにある、最近のセッションに支えられた会話を一覧表示します。

    フィルター: `limit`（最大 500）、`search`、`channel`、`includeDerivedTitles`、`includeLastMessage`。

  </Accordion>
  <Accordion title="conversation_get">
    直接の Gateway セッション検索を使用して、`session_key` で1つの会話を返します。
  </Accordion>
  <Accordion title="messages_read">
    1つのセッションに支えられた会話について、最近のトランスクリプトメッセージを読み取ります。`limit` のデフォルトは 20、最大は 200 です。
  </Accordion>
  <Accordion title="attachments_fetch">
    1つのトランスクリプトメッセージから非テキストメッセージコンテンツブロックを抽出します。これはトランスクリプトコンテンツ上のメタデータビューであり、単独の永続的な添付ファイル blob ストアではありません。
  </Accordion>
  <Accordion title="events_poll">
    数値カーソル以降のキュー済みライブイベントを読み取ります。`limit` は最大 200 です。
  </Accordion>
  <Accordion title="events_wait">
    次に一致するキュー済みイベントが到着するか、タイムアウトが切れるまでロングポーリングします（デフォルト 30s、最大 300s）。

    Claude 固有のプッシュプロトコルなしで、汎用 MCP クライアントがほぼリアルタイムの配信を必要とする場合に使用します。

  </Accordion>
  <Accordion title="messages_send">
    セッションにすでに記録されている同じルートを通じてテキストを送り返します。

    現在の動作:

    - 既存の会話ルートが必要です
    - セッションのチャネル、受信者、アカウント ID、スレッド ID を使用します
    - テキストのみ送信します

  </Accordion>
  <Accordion title="permissions_list_open">
    ブリッジが Gateway に接続してから観測した、保留中の exec/plugin 承認リクエストを一覧表示します。
  </Accordion>
  <Accordion title="permissions_respond">
    次のいずれかで、保留中の exec/plugin 承認リクエストを1つ解決します。

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### イベントモデル

ブリッジは接続中、メモリ内イベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- キューはライブ専用です。MCP ブリッジの開始時に開始します
- `events_poll` と `events_wait` は、それ自体では古い Gateway 履歴を再生しません
- 永続的なバックログは `messages_read` で読み取る必要があります

</Warning>

### Claude チャネル通知

ブリッジは Claude 固有のチャネル通知も公開できます。これは Claude Code チャネルアダプターに相当する OpenClaw の機能です。標準 MCP ツールは引き続き利用でき、ライブ受信メッセージは Claude 固有の MCP 通知としても到着できます。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 標準 MCP ツールのみ。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude チャネル通知を有効にします。
  </Tab>
  <Tab title="auto（デフォルト）">
    `--claude-channel-mode auto`: 現在のデフォルトです。`on` と同じブリッジ動作です。
  </Tab>
</Tabs>

Claude チャネルモードが有効な場合、サーバーは Claude 実験的ケイパビリティを通知し、次を送出できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ動作:

- 受信 `user` トランスクリプトメッセージは `notifications/claude/channel` として転送されます
- MCP 経由で受信した Claude 権限リクエストはメモリ内で追跡されます
- 紐づく会話のコマンド所有者が後で `yes <id>` または `no <id>` を送信した場合（`<id>` は `l` を除く5文字のリクエスト ID）、ブリッジはそれを `notifications/claude/channel/permission` に変換します
- これらの通知はライブセッション専用です。MCP クライアントが切断すると、プッシュ先はありません

これは意図的にクライアント固有です。汎用 MCP クライアントは標準のポーリングツールに依存してください。

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

ほとんどの汎用 MCP クライアントでは、標準ツールサーフェスから始め、Claude モードは無視してください。Claude モードは、Claude 固有の通知メソッドを実際に理解するクライアントでのみオンにしてください。

### オプション

`openclaw mcp serve` は次をサポートします。

<ParamField path="--url" type="string">
  Gateway WebSocket URL。設定されている場合はデフォルトで `gateway.remote.url` になります。
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
可能な場合は、インラインのシークレットよりも `--token-file` または `--password-file` を優先してください。
</Tip>

### セキュリティと信頼境界

ブリッジはルーティングを作り出しません。Gateway がすでにルーティング方法を知っている会話だけを公開します。

つまり、次のようになります。

- 送信者の許可リスト、ペアリング、チャネルレベルの信頼は、引き続き基盤となる OpenClaw チャネル設定に属します
- `messages_send` は、既存の保存済みルート経由でのみ返信できます
- 承認状態は、現在のブリッジセッションについてのみライブ/インメモリです
- ブリッジ認証には、他のリモート Gateway クライアントに信頼して使うものと同じ Gateway トークンまたはパスワード制御を使用してください

会話が `conversations_list` に存在しない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションで、ルートメタデータが欠落しているか不完全です。

### テスト

OpenClaw は、このブリッジ向けに決定的な Docker スモークを同梱しています。

```bash
pnpm test:docker:mcp-channels
```

このスモークは単一のコンテナを実行します。会話状態をシードし、Gateway を起動してから、stdio 子プロセスとして `openclaw mcp serve` を生成し、MCP クライアントとして操作します。会話検出、トランスクリプト読み取り、添付ファイルメタデータ読み取り、ライブイベントキューの挙動、実際の stdio MCP ブリッジ越しの Claude 形式のチャネル通知と権限通知を検証します。送信ルーティング（保存済み会話ルートを再利用する `messages_send`）は、`src/mcp/channel-server.test.ts` の単体テストで別途カバーされています。

これは、実際の Telegram、Discord、iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明する最速の方法です。

より広いテストの文脈については、[テスト](/ja-JP/help/testing) を参照してください。

### トラブルシューティング

<AccordionGroup>
  <Accordion title="会話が返されない">
    通常は、Gateway セッションがまだルーティング可能ではないことを意味します。基盤となるセッションに、保存済みのチャネル/プロバイダー、受信者、および任意のアカウント/スレッドルートメタデータがあることを確認してください。
  </Accordion>
  <Accordion title="events_poll または events_wait が古いメッセージを取り逃がす">
    想定どおりです。ライブキューはブリッジが接続した時点で開始されます。古いトランスクリプト履歴は `messages_read` で読み取ってください。
  </Accordion>
  <Accordion title="Claude 通知が表示されない">
    次のすべてを確認してください。

    - クライアントが stdio MCP セッションを開いたままにしていた
    - `--claude-channel-mode` が `on` または `auto` である
    - クライアントが Claude 固有の通知メソッドを実際に理解している
    - インバウンドメッセージが、ブリッジ接続後に発生した

  </Accordion>
  <Accordion title="承認が見つからない">
    `permissions_list_open` は、ブリッジが接続されている間に観測された承認リクエストのみを表示します。永続的な承認履歴 API ではありません。
  </Accordion>
</AccordionGroup>

## MCP クライアントレジストリとしての OpenClaw

これは `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload`、`unset` のパスです。

これらのコマンドは、MCP 越しに OpenClaw を公開しません。OpenClaw 設定内の `mcp.servers` 配下にある、OpenClaw 管理の MCP サーバー定義を管理します。`config/mcporter.json` から mcporter サーバーを読み取りません。

保存されたこれらの定義は、埋め込み OpenClaw や他のランタイムアダプターなど、OpenClaw が後で起動または設定するランタイム向けです。OpenClaw は定義を中央に保存するため、それらのランタイムが独自の重複した MCP サーバーリストを保持する必要はありません。

<AccordionGroup>
  <Accordion title="重要な挙動">
    - これらのコマンドは OpenClaw 設定の読み書きのみを行います
    - `status`、`list`、`show`、`--probe` なしの `doctor`、`set`、`configure`、`tools`、`logout`、`reload`、`unset` は、対象の MCP サーバーに接続しません
    - `login` は、設定済み HTTP サーバーに対して MCP OAuth ネットワークフローを実行し、結果のローカル認証情報を保存します
    - `status --verbose` は、接続せずに、解決済みのトランスポート、認証、タイムアウト、フィルター、並列ツール呼び出しヒントを出力します
    - `doctor` は、stdio コマンドの欠落、無効な作業ディレクトリ、TLS ファイルの欠落、無効化されたサーバー、リテラルの機密ヘッダー/env 値、不完全な OAuth 認可など、ローカルセットアップ上の問題について保存済み定義をチェックします
    - `doctor --probe` は、静的チェックが通った後に `probe` と同じライブ接続証明を追加します
    - `probe` は、選択したサーバーまたは設定済みの全サーバーに接続し、ツールを一覧表示して、機能/診断を報告します
    - `add` は、`--no-probe` が設定されている場合、または OAuth 認可が先に必要な場合を除き、保存前にフラグから定義を構築してプローブします
    - ランタイムアダプターは、実行時に実際にサポートするトランスポート形状を決定します
    - `enabled: false` はサーバーを保存したままにしますが、埋め込みランタイム検出からは除外します
    - `timeout` と `connectTimeout` は、サーバーごとのリクエストタイムアウトと接続タイムアウトを秒単位で設定します
    - `supportsParallelToolCalls: true` は、アダプターが同時に呼び出せるサーバーを示します
    - HTTP サーバーは、静的ヘッダー、OAuth ログイン、TLS 検証制御、mTLS 証明書/鍵パスを使用できます
    - 埋め込み OpenClaw は、設定済み MCP ツールを通常の `coding` および `messaging` ツールプロファイルで公開します。`minimal` では引き続き非表示になり、`tools.deny: ["bundle-mcp"]` によって明示的に無効化されます
    - サーバーごとの `toolFilter.include` と `toolFilter.exclude` は、検出された MCP ツールが OpenClaw ツールになる前にフィルターします
    - リソースまたはプロンプトを広告するサーバーは、リソースの一覧/読み取り、およびプロンプトの一覧/取得用のユーティリティツールも公開します。生成されたこれらのユーティリティ名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）には、同じ include/exclude フィルターが適用されます
    - 動的な MCP ツールリスト変更は、そのセッションのキャッシュ済みカタログを無効化します。次回の検出/使用時にサーバーから更新されます
    - MCP ツールリクエスト/プロトコルの失敗が繰り返されると、そのサーバーは短時間一時停止され、壊れたサーバー 1 つがターン全体を消費しないようにします
    - セッションスコープの同梱 MCP ランタイムは、`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます（デフォルトは 10 分、無効化するには `0` を設定）。ワンショットの埋め込み実行では、実行終了時にクリーンアップされます

  </Accordion>
</AccordionGroup>

ランタイムアダプターは、この共有レジストリを下流クライアントが期待する形状に正規化する場合があります。たとえば、埋め込み OpenClaw は OpenClaw の `transport` 値を直接消費しますが、Claude Code と Gemini は `http`、`sse`、`stdio` などの CLI ネイティブな `type` 値を受け取ります。

Codex app-server も、各サーバーの任意の `codex` ブロックを尊重します。これは
Codex app-server スレッド専用の OpenClaw 投影メタデータです。ACP セッション、汎用 Codex ハーネス設定、または他のランタイムアダプターは変更しません。
サーバーを特定の OpenClaw エージェント ID にのみ投影するには、空でない `codex.agents` を使用します。空、空白、または無効なエージェントリストは設定検証で拒否され、グローバルになる代わりにランタイム投影パスで省略されます。信頼済みサーバー向けに Codex のネイティブな `default_tools_approval_mode` を出力するには、`codex.defaultToolsApprovalMode`（`auto`、`prompt`、または `approve`）を使用します。
OpenClaw はネイティブの `mcp_servers` 設定を Codex に渡す前に、`codex` メタデータを取り除きます。

### 保存済み MCP サーバー定義

コマンド:

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

注記:

- `list` はサーバー名をソートします。
- 名前なしの `show` は、設定済み MCP サーバーオブジェクト全体を出力します。
- `status` は、接続せずに設定済みトランスポートを分類します。`--verbose` には、解決済みの起動、タイムアウト、OAuth、フィルター、並列呼び出しの詳細が含まれます。
- `doctor` は、接続せずに静的チェックを実行します。有効なサーバーが接続できることも検証する必要がある場合は、`--probe` を追加します。
- `probe` は接続し、ツール数、リソース/プロンプトのサポート、リスト変更サポート、診断を報告します。
- `add` は、`--command`、`--arg`、`--env`、`--cwd` などの stdio フラグ、または `--url`、`--transport`、`--header`、`--auth oauth`、TLS、タイムアウト、ツール選択フラグなどの HTTP フラグを受け付けます。
- `set` は、コマンドライン上で 1 つの JSON オブジェクト値を想定します。
- `configure` は、サーバー定義全体を置き換えずに、有効化、ツールフィルター、タイムアウト、OAuth、TLS、並列ツール呼び出しヒントを更新します。保存前に更新後のサーバーを検証するには、`--probe` を追加します。
- `tools` は、サーバーごとのツールフィルターを更新します。include/exclude エントリは MCP ツール名と単純な `*` glob です。
- `login` は、`auth: "oauth"` で設定された HTTP サーバーに対して OAuth フローを実行します。初回実行時に認可 URL が出力されます。承認後に `--code` を付けて再実行してください。
- `logout` は、保存済みサーバー定義を削除せずに、指定されたサーバーの保存済み OAuth 認証情報を消去します。
- `reload` は、現在の CLI プロセスについてのみ、キャッシュ済みのインプロセス MCP ランタイムを破棄します。別プロセス内の Gateway またはエージェントプロセスには、引き続き独自の再読み込みまたは再起動パスが必要です。
- Streamable HTTP MCP サーバーには `transport: "streamable-http"` を使用してください。`openclaw mcp set` は、互換性のために CLI ネイティブな `type: "http"` も同じ正規設定形状に正規化します。
- 指定されたサーバーが存在しない場合、`unset` は失敗します。

例:

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

これらの例はサーバー定義のみを保存します。その後、`openclaw mcp doctor --probe` を実行して、サーバーが起動しツールを公開することを証明してください。

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

    ファイルシステムサーバーのスコープは、エージェントが読み取りまたは編集すべき最小のディレクトリツリーに限定してください。

  </Tab>
  <Tab title="メモリ">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    サーバーが通常のエージェントに利用可能にすべきでない書き込みツールを公開している場合は、ツールフィルターを使用してください。

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

    `doctor` は、`cwd` が存在することと、設定済み環境からコマンドを解決できることを確認します。

  </Tab>
  <Tab title="Remote HTTP">
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

    リモートサーバーが OAuth に対応している場合は OAuth を使用します。サーバーが静的ヘッダーを必要とする場合は、リテラルのベアラートークンをコミットしないでください。

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接のデスクトップ制御サーバーは、起動するプロセスの権限を継承します。狭いツールフィルターと OS レベルの権限プロンプトを使用してください。

  </Tab>
</Tabs>

### JSON 出力形状

スクリプトとダッシュボードには `--json` を使用します。フィールドセットは時間とともに増える可能性があるため、コンシューマーは不明なキーを無視してください。

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
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` は、有効化されチェックされたサーバーのいずれかに `error` レベルの問題がある場合、非ゼロで終了します。`warning` と `info` の問題は報告されますが、それだけでコマンドが失敗することはありません。

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

    `probe --json` はライブ MCP クライアントセッションを開き、その結果を直接出力します。`status`/`doctor` とは異なり、出力にトップレベルの `path` フィールドはありません。`resources` と `prompts` キーは、サーバーがその機能を実際に公開している場合にのみ存在します（プロンプトを持たないサーバーは、`false` を報告するのではなく `prompts` キーを省略します）。静的な設定監査ではなく、到達性と機能の証明には `probe` を使用してください。

  </Accordion>
</AccordionGroup>

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

| フィールド                 | 説明                                   |
| -------------------------- | -------------------------------------- |
| `command`                  | 起動する実行可能ファイル（必須）       |
| `args`                     | コマンドライン引数の配列               |
| `env`                      | 追加の環境変数                         |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ             |

<Warning>
**Stdio env 安全フィルター**

OpenClaw は、stdio MCP サーバーを起動する前に、インタープリター起動、ローダーハイジャック、シェル初期化の env キーを拒否します。これは、サーバーの `env` ブロックに現れている場合でも同じです。これは、他の OpenClaw が起動するプロセスと同じホスト環境セキュリティポリシーを使用します。既知のインタープリター起動フック（例: `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`）、共有ライブラリと関数インジェクションのプレフィックス（`DYLD_*`, `LD_*`, `BASH_FUNC_*`）、および類似のランタイム制御変数をブロックします。起動時にこれらは黙って削除され、警告がログに記録されるため、暗黙の前置処理を注入したり、インタープリターを差し替えたり、デバッガーを有効化したり、stdio プロセスに対して動的リンカーをハイジャックしたりできません。明示的な許可リストにより、通常の MCP 認証情報 env 変数（`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`）は使用可能なままです。通常のプロキシおよびサーバー固有の env 変数（`HTTP_PROXY`, カスタム `*_API_KEY` など）も同様です。`AWS_CONFIG_FILE` や `AWS_SHARED_CREDENTIALS_FILE` などの他の `AWS_*` キーは、認証情報値を直接運ぶのではなく認証情報ファイルを指すため、引き続きブロックされます。

MCP サーバーがブロック対象の変数を本当に必要とする場合は、stdio サーバーの `env` の下ではなく、Gateway ホストプロセスに設定してください。
</Warning>

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| フィールド                     | 説明                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `url`                          | リモートサーバーの HTTP または HTTPS URL（必須）                  |
| `headers`                      | HTTP ヘッダーの任意のキー値マップ（例: 認証トークン）             |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト（ミリ秒、任意）                     |
| `connectTimeout`               | サーバーごとの接続タイムアウト（秒、任意）                         |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）        |
| `auth: "oauth"`                | MCP OAuth トークンストレージと `openclaw mcp login` を使用         |
| `sslVerify`                    | 明示的に信頼されたプライベート HTTPS エンドポイントでのみ false に設定 |
| `clientCert` / `clientKey`     | mTLS クライアント証明書とキーのパス                                |
| `supportsParallelToolCalls`    | このサーバーで同時呼び出しが安全であることを示すヒント             |

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

`url`（userinfo）と `headers` 内の機密値は、ログとステータス出力で秘匿されます。`openclaw mcp doctor` は、機密に見える `headers` または `env` エントリにリテラル値が含まれている場合に警告するため、運用者はそれらの値をコミット済み設定の外へ移動できます。

### OAuth ワークフロー

OAuth は、MCP OAuth フローを公開する HTTP MCP サーバー向けです。`auth: "oauth"` が有効な間、そのサーバーの静的な `Authorization` ヘッダーは無視されます。

<Steps>
  <Step title="Save the server">
    `auth: "oauth"` と任意の OAuth メタデータを使用して、サーバーを追加または更新します。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    ログインを実行して認可リクエストを作成します。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw は認可 URL を出力し、一時的な OAuth 検証状態を OpenClaw 状態ディレクトリの下に保存します。

  </Step>
  <Step title="Finish with the code">
    ブラウザーで承認した後、返されたコードを OpenClaw に渡します。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    トークンが存在することを確認するには、ステータスまたは doctor を使用します。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    ログアウトは、保存済みサーバー定義を保持したまま、保存済み OAuth 認証情報を削除します。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

プロバイダーがトークンをローテーションした場合、または認可状態が固着した場合は、`openclaw mcp logout <name>` を実行してから `login` を繰り返します。サーバー名と URL が認証情報ストアのエントリを引き続き識別できる限り、`auth: "oauth"` が設定から削除された後でも、`logout` は保存済み HTTP サーバーの認証情報を消去できます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` および `stdio` と並ぶ追加のトランスポートオプションです。リモート MCP サーバーとの双方向通信に HTTP ストリーミングを使用します。

| フィールド                     | 説明                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | リモートサーバーの HTTP または HTTPS URL（必須）                                      |
| `transport`                    | このトランスポートを選択するには `"streamable-http"` に設定。省略時、OpenClaw は `sse` を使用 |
| `headers`                      | HTTP ヘッダーの任意のキー値マップ（例: 認証トークン）                                 |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト（ミリ秒、任意）                                        |
| `connectTimeout`               | サーバーごとの接続タイムアウト（秒、任意）                                            |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト（秒またはミリ秒）                           |
| `auth: "oauth"`                | MCP OAuth トークンストレージと `openclaw mcp login` を使用                            |
| `sslVerify`                    | 明示的に信頼されたプライベート HTTPS エンドポイントでのみ false に設定                |
| `clientCert` / `clientKey`     | mTLS クライアント証明書とキーのパス                                                   |
| `supportsParallelToolCalls`    | このサーバーで同時呼び出しが安全であることを示すヒント                                |

OpenClaw 設定では、正規の表記として `transport: "streamable-http"` を使用します。CLI ネイティブ MCP の `type: "http"` 値は、`openclaw mcp set` 経由で保存された場合に受け入れられ、既存の設定では `openclaw doctor --fix` によって修復されますが、埋め込み OpenClaw が直接消費するのは `transport` です。

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
レジストリコマンドはチャネルブリッジを起動しません。`probe` と `doctor --probe` だけがライブ MCP クライアントセッションを開き、ターゲットサーバーに到達できることを証明します。
</Note>

## コントロール UI

ブラウザーの Control UI には、`/mcp` に専用の MCP 設定ページがあります。設定済みサーバー数、有効化/OAuth/フィルターの概要、サーバーごとのトランスポート行、有効化/無効化コントロール、一般的な CLI コマンド、`mcp` 設定セクション用のスコープ付きエディターが表示されます。

オペレーターによる編集と簡易インベントリにはこのページを使用します。ライブサーバーの証明が必要な場合は、`openclaw mcp doctor --probe` または `openclaw mcp probe` を使用します。

オペレーターワークフロー:

1. Control UI を開き、**MCP** を選択します。
2. 合計、有効、OAuth、フィルター済みサーバーのサマリーカードを確認します。
3. 各サーバー行で、トランスポート、認証、フィルター、タイムアウト、コマンドのヒントを確認します。
4. 定義を保持しつつランタイム検出から除外したい場合は、有効化を切り替えます。
5. 新しいサーバー、ヘッダー、TLS、OAuth メタデータ、ツールフィルターなどの構造的な変更には、スコープ付きの `mcp` 設定セクションを編集します。
6. 設定のみを永続化するには **Save** を選択し、Gateway 設定パスを通じて適用するには **Save & Publish** を選択します。
7. 編集したサーバーが起動してツールを一覧表示することのライブ証明が必要な場合は、`openclaw mcp doctor --probe` を実行します。

注記:

- コマンドスニペットではサーバー名を引用符で囲むため、通常と異なる名前でもシェルにコピーできます
- 表示される URL 風の値に埋め込み認証情報が含まれる場合は、レンダリング前に伏せられます
- このページ自体は MCP トランスポートを起動しません
- アクティブなランタイムでは、MCP クライアントを所有するプロセスに応じて、`openclaw mcp reload`、Gateway 設定の公開、またはプロセス再起動が必要になる場合があります

## 現在の制限

このページは、現在出荷されているブリッジについて説明します。

現在の制限:

- 会話の検出は既存の Gateway セッションルートメタデータに依存します
- Claude 固有のアダプター以外に汎用プッシュプロトコルはありません
- メッセージ編集ツールやリアクションツールはまだありません
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続します。多重化されたアップストリームはまだありません
- `permissions_list_open` には、ブリッジ接続中に観測された承認のみが含まれます

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Plugins](/ja-JP/cli/plugins)
