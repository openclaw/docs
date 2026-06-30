---
read_when:
    - Codex、Claude Code、または別の MCP クライアントを OpenClaw バックのチャネルに接続する
    - '`openclaw mcp serve` を実行中'
    - OpenClaw が保存した MCP サーバー定義の管理
sidebarTitle: MCP
summary: MCP 経由で OpenClaw チャンネルの会話を公開し、保存済み MCP サーバー定義を管理する
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:05:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` には 2 つの役割があります。

- `openclaw mcp serve` で OpenClaw を MCP サーバーとして実行する
- `list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、`configure`、`tools`、`login`、`logout`、`reload`、`unset` で、OpenClaw 管理のアウトバウンド MCP サーバー定義を管理する

言い換えると:

- `serve` は OpenClaw が MCP サーバーとして動作するものです
- その他のサブコマンドは、OpenClaw のランタイムが後で利用する可能性のある MCP サーバーについて、OpenClaw が MCP クライアント側レジストリとして動作するものです

<Note>
  `list`、`show`、`set`、`unset` は OpenClaw 設定内の OpenClaw 管理 `mcp.servers` エントリだけを読み書きします。`config/mcporter.json` の mcporter サーバーは含まれません。そのレジストリには `mcporter list` を使用してください。
</Note>

OpenClaw 自身がコーディングハーネスセッションをホストし、そのランタイムを ACP 経由でルーティングする必要がある場合は [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

## 適切な MCP パスを選ぶ

OpenClaw には複数の MCP サーフェスがあります。エージェントランタイムの所有者とツールの所有者に一致するものを選んでください。

| 目的                                                                | 使用するもの                                                                  | 理由                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 外部 MCP クライアントに OpenClaw チャンネル会話を読み取り/送信させる | `openclaw mcp serve`                                                 | OpenClaw が MCP サーバーになり、Gateway バックの会話を stdio 経由で公開します。                                 |
| OpenClaw 管理のエージェント実行用にサードパーティ MCP サーバーを保存する        | `openclaw mcp add`、`set`、`configure`、`tools`、`login`             | OpenClaw が MCP クライアント側レジストリになり、後でそれらのサーバーを対象ランタイムへ投影します。               |
| エージェントターンを実行せずに保存済みサーバーを確認する                  | `openclaw mcp status`、`doctor`、`probe`                             | `status` と `doctor` は設定を検査し、`probe` はライブ MCP 接続を開いてケイパビリティを一覧表示します。               |
| ブラウザーから MCP 設定を編集する                                      | Control UI `/mcp`                                                    | このページはインベントリ、有効化状態、OAuth/フィルター概要、コマンドヒント、スコープ付き `mcp` エディターを表示します。         |
| Codex app-server にスコープ付きネイティブ MCP サーバーを与える                    | `mcp.servers.<name>.codex`                                           | `codex` ブロックは Codex app-server スレッド投影にのみ影響し、ネイティブ設定の引き渡し前に取り除かれます。 |
| ACP ホスト型ハーネスセッションを実行する                                     | [`openclaw acp`](/ja-JP/cli/acp) と [ACP エージェント](/ja-JP/tools/acp-agents-setup) | ACP ブリッジモードはセッションごとの MCP サーバー注入を受け付けません。代わりに gateway/plugin ブリッジを設定してください。     |

<Tip>
必要なパスがわからない場合は、`openclaw mcp status --verbose` から始めてください。MCP サーバーを起動せずに、OpenClaw が保存している内容を表示します。
</Tip>

## MCP サーバーとしての OpenClaw

これは `openclaw mcp serve` パスです。

### `serve` を使う場合

次の場合は `openclaw mcp serve` を使用してください。

- Codex、Claude Code、または別の MCP クライアントが OpenClaw バックのチャンネル会話と直接通信する必要がある
- ルーティング済みセッションを持つローカルまたはリモートの OpenClaw Gateway がすでにある
- チャンネルごとに別々のブリッジを実行する代わりに、OpenClaw のチャンネルバックエンド全体で動作する 1 つの MCP サーバーが必要である

OpenClaw がコーディングランタイム自体をホストし、エージェントセッションを OpenClaw 内に保持する必要がある場合は、代わりに [`openclaw acp`](/ja-JP/cli/acp) を使用してください。

### 仕組み

`openclaw mcp serve` は stdio MCP サーバーを起動します。そのプロセスは MCP クライアントが所有します。クライアントが stdio セッションを開いたままにしている間、ブリッジは WebSocket 経由でローカルまたはリモートの OpenClaw Gateway に接続し、ルーティング済みチャンネル会話を MCP 経由で公開します。

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
  <Step title="ライブイベントのキュー">
    ブリッジが接続されている間、ライブイベントはメモリ内でキューに入ります。
  </Step>
  <Step title="任意の Claude プッシュ">
    Claude チャンネルモードが有効な場合、同じセッションは Claude 固有のプッシュ通知も受け取れます。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="重要な動作">
    - ライブキュー状態はブリッジ接続時に開始されます
    - 以前のトランスクリプト履歴は `messages_read` で読み取られます
    - Claude プッシュ通知は MCP セッションが生存している間だけ存在します
    - クライアントが切断すると、ブリッジは終了し、ライブキューはなくなります
    - `openclaw agent` や `openclaw infer model run` などのワンショットエージェントエントリポイントは、返信完了時に開いたバンドル MCP ランタイムをすべて終了するため、スクリプト実行を繰り返しても stdio MCP 子プロセスは蓄積されません
    - OpenClaw によって起動された stdio MCP サーバー（バンドルまたはユーザー設定）は、シャットダウン時にプロセスツリーとして破棄されるため、サーバーが開始した子サブプロセスは親 stdio クライアントの終了後に残りません
    - セッションを削除またはリセットすると、共有ランタイムクリーンアップパスを通じてそのセッションの MCP クライアントが破棄されるため、削除されたセッションに紐づく stdio 接続は残りません

  </Accordion>
</AccordionGroup>

### クライアントモードを選ぶ

同じブリッジを 2 つの異なる方法で使用できます。

<Tabs>
  <Tab title="汎用 MCP クライアント">
    標準 MCP ツールのみです。`conversations_list`、`messages_read`、`events_poll`、`events_wait`、`messages_send`、承認ツールを使用します。
  </Tab>
  <Tab title="Claude Code">
    標準 MCP ツールに加えて、Claude 固有のチャンネルアダプターを使用します。`--claude-channel-mode on` を有効にするか、既定の `auto` のままにします。
  </Tab>
</Tabs>

<Note>
現在、`auto` は `on` と同じように動作します。クライアントケイパビリティ検出はまだありません。
</Note>

### `serve` が公開するもの

ブリッジは既存の Gateway セッションルートメタデータを使用して、チャンネルバックの会話を公開します。OpenClaw に、次のような既知のルートを持つセッション状態がすでにある場合、会話が表示されます。

- `channel`
- 受信者または宛先メタデータ
- 任意の `accountId`
- 任意の `threadId`

これにより、MCP クライアントは 1 か所で次のことができます。

- 最近のルーティング済み会話を一覧表示する
- 最近のトランスクリプト履歴を読む
- 新しい受信イベントを待つ
- 同じルートを通じて返信を送信する
- ブリッジ接続中に到着した承認リクエストを確認する

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
  <Tab title="詳細 / Claude オフ">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### ブリッジツール

現在のブリッジは次の MCP ツールを公開します。

<AccordionGroup>
  <Accordion title="conversations_list">
    Gateway セッション状態内にルートメタデータをすでに持つ、最近のセッションバック会話を一覧表示します。

    便利なフィルター:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    直接の Gateway セッション検索を使用して、`session_key` によって 1 つの会話を返します。
  </Accordion>
  <Accordion title="messages_read">
    1 つのセッションバック会話について、最近のトランスクリプトメッセージを読み取ります。
  </Accordion>
  <Accordion title="attachments_fetch">
    1 つのトランスクリプトメッセージから非テキストメッセージコンテンツブロックを抽出します。これはトランスクリプト内容に対するメタデータビューであり、単独で永続的な添付ファイル blob ストアではありません。
  </Accordion>
  <Accordion title="events_poll">
    数値カーソル以降のキュー済みライブイベントを読み取ります。
  </Accordion>
  <Accordion title="events_wait">
    次の一致するキュー済みイベントが到着するか、タイムアウトが期限切れになるまでロングポーリングします。

    汎用 MCP クライアントが Claude 固有のプッシュプロトコルなしでほぼリアルタイムの配信を必要とする場合に使用します。

  </Accordion>
  <Accordion title="messages_send">
    セッションにすでに記録されている同じルートを通じてテキストを送り返します。

    現在の動作:

    - 既存の会話ルートが必要です
    - セッションのチャンネル、受信者、アカウント ID、スレッド ID を使用します
    - テキストのみを送信します

  </Accordion>
  <Accordion title="permissions_list_open">
    ブリッジが Gateway に接続してから観測した保留中の exec/plugin 承認リクエストを一覧表示します。
  </Accordion>
  <Accordion title="permissions_respond">
    保留中の exec/plugin 承認リクエスト 1 件を次のいずれかで解決します。

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### イベントモデル

ブリッジは接続されている間、メモリ内イベントキューを保持します。

現在のイベントタイプ:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- キューはライブ専用です。MCP ブリッジの開始時に開始されます
- `events_poll` と `events_wait` は、それ自体では古い Gateway 履歴を再生しません
- 永続的なバックログは `messages_read` で読み取ってください

</Warning>

### Claude チャンネル通知

ブリッジは Claude 固有のチャンネル通知も公開できます。これは Claude Code チャンネルアダプターに相当する OpenClaw の機能です。標準 MCP ツールは引き続き使用できますが、ライブ受信メッセージを Claude 固有の MCP 通知として受け取ることもできます。

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: 標準 MCP ツールのみ。
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude チャンネル通知を有効にします。
  </Tab>
  <Tab title="auto（既定）">
    `--claude-channel-mode auto`: 現在の既定値です。`on` と同じブリッジ動作です。
  </Tab>
</Tabs>

Claude チャンネルモードが有効な場合、サーバーは Claude 実験的ケイパビリティを広告し、次を送出できます。

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

現在のブリッジ動作:

- 受信 `user` トランスクリプトメッセージは `notifications/claude/channel` として転送されます
- MCP 経由で受信した Claude 権限リクエストはメモリ内で追跡されます
- 紐づく会話内のコマンド所有者が後で `yes abcde` または `no abcde` を送信した場合、ブリッジはそれを `notifications/claude/channel/permission` に変換します
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

ほとんどの汎用 MCP クライアントでは、標準ツールサーフェスから始め、Claude モードは無視してください。Claude 固有の通知メソッドを実際に理解するクライアントに限り、Claude モードをオンにしてください。

### オプション

`openclaw mcp serve` は次をサポートします。

<ParamField path="--url" type="string">
  Gateway WebSocket URL。
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
  Claude 通知モード。
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
- `messages_send` は、既存の保存済みルートを通じてのみ返信できます
- 承認状態は現在のブリッジセッションに対してのみライブかつインメモリです
- ブリッジ認証には、他のリモート Gateway クライアントで信頼するものと同じ Gateway トークンまたはパスワード制御を使用してください

会話が `conversations_list` にない場合、通常の原因は MCP 設定ではありません。基盤となる Gateway セッションのルートメタデータが欠落しているか不完全です。

### テスト

OpenClaw は、このブリッジ向けに決定的な Docker スモークを同梱しています。

```bash
pnpm test:docker:mcp-channels
```

このスモークは次を行います。

- シード済みの Gateway コンテナを起動します
- `openclaw mcp serve` を生成する 2 つ目のコンテナを起動します
- 会話の検出、トランスクリプト読み取り、添付メタデータ読み取り、ライブイベントキューの挙動、送信ルーティングを検証します
- 実際の stdio MCP ブリッジ経由で、Claude 形式のチャネル通知と権限通知を検証します

これは、実際の Telegram、Discord、または iMessage アカウントをテスト実行に接続せずに、ブリッジが動作することを証明する最速の方法です。

より広いテストのコンテキストについては、[テスト](/ja-JP/help/testing) を参照してください。

### トラブルシューティング

<AccordionGroup>
  <Accordion title="会話が返されない">
    通常は、Gateway セッションがまだルーティング可能でないことを意味します。基盤となるセッションに、保存済みのチャネル/プロバイダー、受信者、省略可能なアカウント/スレッドのルートメタデータがあることを確認してください。
  </Accordion>
  <Accordion title="events_poll または events_wait が古いメッセージを取りこぼす">
    想定どおりです。ライブキューはブリッジが接続した時点で開始されます。古いトランスクリプト履歴は `messages_read` で読み取ってください。
  </Accordion>
  <Accordion title="Claude 通知が表示されない">
    次のすべてを確認してください。

    - クライアントが stdio MCP セッションを開いたままにしている
    - `--claude-channel-mode` が `on` または `auto` である
    - クライアントが Claude 固有の通知メソッドを実際に理解している
    - 受信メッセージがブリッジ接続後に発生した

  </Accordion>
  <Accordion title="承認が見つからない">
    `permissions_list_open` は、ブリッジ接続中に観測された承認リクエストだけを表示します。これは永続的な承認履歴 API ではありません。
  </Accordion>
</AccordionGroup>

## MCP クライアントレジストリとしての OpenClaw

これは `openclaw mcp list`、`show`、`status`、`doctor`、`probe`、`add`、`set`、
`configure`、`tools`、`login`、`logout`、`reload`、および `unset` のパスです。

これらのコマンドは MCP 経由で OpenClaw を公開しません。OpenClaw 設定内の `mcp.servers` 配下にある OpenClaw 管理の MCP サーバー定義を管理します。`config/mcporter.json` から mcporter サーバーを読み取りません。

保存されたこれらの定義は、組み込み OpenClaw や他のランタイムアダプターなど、OpenClaw が後で起動または設定するランタイム向けです。OpenClaw は定義を一元的に保存するため、それらのランタイムが重複した独自の MCP サーバーリストを保持する必要はありません。

<AccordionGroup>
  <Accordion title="重要な挙動">
    - これらのコマンドは OpenClaw 設定の読み書きだけを行います
    - `status`、`list`、`show`、`--probe` なしの `doctor`、`set`、`configure`、`tools`、`logout`、`reload`、および `unset` は対象の MCP サーバーに接続しません
    - `login` は設定済み HTTP サーバーに対して MCP OAuth ネットワークフローを実行し、結果のローカル認証情報を保存します
    - `status --verbose` は、接続せずに解決済みのトランスポート、認証、タイムアウト、フィルター、並列ツール呼び出しのヒントを出力します
    - `doctor` は、stdio コマンドの欠落、無効な作業ディレクトリ、TLS ファイルの欠落、無効化されたサーバー、リテラルの機密ヘッダー/env 値、不完全な OAuth 認可など、ローカルセットアップ上の問題について保存済み定義を確認します
    - `doctor --probe` は、静的チェックに合格した後で `probe` と同じライブ接続証明を追加します
    - `probe` は選択したサーバーまたはすべての設定済みサーバーに接続し、ツールを一覧表示し、機能/診断を報告します
    - `add` はフラグから定義を構築し、`--no-probe` が設定されている場合、または先に OAuth 認可が必要な場合を除き、保存前にプローブします
    - ランタイムアダプターは、実行時に実際にサポートするトランスポート形状を決定します
    - `enabled: false` はサーバーを保存したままにしますが、組み込みランタイム検出から除外します
    - `timeout` と `connectTimeout` は、サーバーごとのリクエストタイムアウトと接続タイムアウトを秒単位で設定します
    - `supportsParallelToolCalls: true` は、アダプターが並行呼び出しできるサーバーであることを示します
    - HTTP サーバーは、静的ヘッダー、OAuth ログイン、TLS 検証制御、mTLS 証明書/キーのパスを使用できます
    - 組み込み OpenClaw は、通常の `coding` および `messaging` ツールプロファイルで設定済み MCP ツールを公開します。`minimal` では引き続き非表示になり、`tools.deny: ["bundle-mcp"]` は明示的に無効化します
    - サーバーごとの `toolFilter.include` と `toolFilter.exclude` は、検出された MCP ツールが OpenClaw ツールになる前にフィルタリングします
    - リソースまたはプロンプトをアドバタイズするサーバーは、リソースの一覧表示/読み取りと、プロンプトの一覧表示/取得のためのユーティリティツールも公開します。生成されたこれらのユーティリティ名（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`）には同じ include/exclude フィルターが適用されます
    - 動的な MCP ツールリスト変更は、そのセッションのキャッシュ済みカタログを無効化します。次回の検出/使用時にサーバーから更新されます
    - MCP ツールのリクエスト/プロトコル失敗が繰り返されると、壊れた 1 台のサーバーがターン全体を消費しないように、そのサーバーは短時間一時停止されます
    - セッションスコープのバンドル済み MCP ランタイムは、`mcp.sessionIdleTtlMs` ミリ秒のアイドル時間後に回収されます（デフォルトは 10 分、無効化するには `0` を設定）。ワンショットの組み込み実行では、実行終了時にそれらがクリーンアップされます

  </Accordion>
</AccordionGroup>

ランタイムアダプターは、この共有レジストリを下流クライアントが期待する形状に正規化する場合があります。たとえば、組み込み OpenClaw は OpenClaw の `transport` 値を直接消費しますが、Claude Code と Gemini は `http`、`sse`、`stdio` などの CLI ネイティブな `type` 値を受け取ります。

Codex app-server は、各サーバー上の省略可能な `codex` ブロックも尊重します。これは
Codex app-server スレッド専用の OpenClaw 投影メタデータです。ACP セッション、汎用 Codex ハーネス設定、または他のランタイムアダプターは変更しません。
空でない `codex.agents` を使用すると、サーバーを特定の OpenClaw
エージェント ID のみに投影できます。空、空白、または無効なエージェントリストは設定
検証で拒否され、グローバルになるのではなくランタイム投影パスで省略されます。
信頼済みサーバーに対して Codex ネイティブの `default_tools_approval_mode` を出力するには、`codex.defaultToolsApprovalMode`（`auto`、`prompt`、または `approve`）を使用します。
OpenClaw は、ネイティブの `mcp_servers`
設定を Codex に渡す前に `codex` メタデータを取り除きます。

### 保存済み MCP サーバー定義

OpenClaw は、OpenClaw 管理の MCP 定義を必要とするサーフェス向けに、軽量な MCP サーバーレジストリも設定内に保存します。

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
- `status` は接続せずに設定済みトランスポートを分類します。`--verbose` には、解決済みの起動、タイムアウト、OAuth、フィルター、並列呼び出しの詳細が含まれます。
- `doctor` は接続せずに静的チェックを実行します。有効化されたサーバーが接続できることも検証したい場合は、`--probe` を追加してください。
- `probe` は接続し、ツール数、リソース/プロンプトのサポート、リスト変更サポート、診断を報告します。
- `add` は、`--command`、`--arg`、`--env`、`--cwd` などの stdio フラグ、または `--url`、`--transport`、`--header`、`--auth oauth`、TLS、タイムアウト、ツール選択フラグなどの HTTP フラグを受け付けます。
- `set` はコマンドライン上で 1 つの JSON オブジェクト値を期待します。
- `configure` は、サーバー定義全体を置き換えずに、有効化、ツールフィルター、タイムアウト、OAuth、TLS、並列ツール呼び出しのヒントを更新します。
- `tools` はサーバーごとのツールフィルターを更新します。include/exclude エントリは MCP ツール名と単純な `*` glob です。
- `login` は、`auth: "oauth"` で設定された HTTP サーバーに対して OAuth フローを実行します。初回実行時には認可 URL が出力されます。承認後に `--code` 付きで再実行してください。
- `logout` は、保存済みサーバー定義を削除せずに、指定されたサーバーの保存済み OAuth 認証情報を消去します。
- `reload` は、キャッシュされたプロセス内 MCP ランタイムを破棄します。別プロセス内の Gateway またはエージェントプロセスには、引き続きそれぞれのリロードまたは再起動パスが必要です。
- Streamable HTTP MCP サーバーには `transport: "streamable-http"` を使用してください。`openclaw mcp set` は、互換性のために CLI ネイティブの `type: "http"` も同じ正規設定形状に正規化します。
- `unset` は、指定されたサーバーが存在しない場合に失敗します。

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

これらの例はサーバー定義だけを保存します。その後で `openclaw mcp doctor --probe` を実行し、サーバーが起動してツールを公開することを証明してください。

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

    `doctor` は、`cwd` が存在すること、および設定済み環境からコマンドを解決できることを確認します。

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

    リモートサーバーが対応している場合は OAuth を使用します。サーバーが静的ヘッダーを必要とする場合、リテラルのベアラートークンをコミットしないでください。

  </Tab>
  <Tab title="デスクトップ/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    直接デスクトップ制御を行うサーバーは、起動するプロセスの権限を継承します。限定的なツールフィルターと OS レベルの権限プロンプトを使用してください。

  </Tab>
</Tabs>

### JSON 出力形状

スクリプトとダッシュボードでは `--json` を使用します。フィールドセットは時間とともに増える可能性があるため、コンシューマーは未知のキーを無視してください。

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` は、有効化されチェックされたサーバーのいずれかにエラーがある場合、非ゼロで終了します。警告は報告されますが、それだけでコマンドが失敗することはありません。

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` はライブ MCP クライアントセッションを開きます。静的な設定監査ではなく、到達性と機能の証明に使用してください。

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

| フィールド                      | 説明                       |
| -------------------------- | --------------------------------- |
| `command`                  | 起動する実行可能ファイル (必須)    |
| `args`                     | コマンドライン引数の配列   |
| `env`                      | 追加の環境変数       |
| `cwd` / `workingDirectory` | プロセスの作業ディレクトリ |

<Warning>
**Stdio env 安全フィルター**

OpenClaw は、サーバーの `env` ブロックに現れる場合でも、最初の RPC の前に stdio MCP サーバーの起動方法を変更できるインタープリター起動環境キーを拒否します。ブロックされるキーには、`BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHONSTARTUP`、`PYTHONPATH`、`PERL5OPT`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH`、および同様のランタイム制御変数が含まれます。これらは、暗黙のプリリュードを注入したり、インタープリターを差し替えたり、デバッガーを有効化したり、stdio プロセスに対してランタイム出力をリダイレクトしたりできないよう、起動時に設定エラーとして拒否されます。通常の認証情報、プロキシ、サーバー固有の環境変数 (`GITHUB_TOKEN`、`HTTP_PROXY`、カスタム `*_API_KEY` など) には影響しません。

MCP サーバーがブロック対象の変数のいずれかを本当に必要とする場合は、stdio サーバーの `env` 配下ではなく、gateway ホストプロセスに設定してください。
</Warning>

### SSE / HTTP トランスポート

HTTP Server-Sent Events 経由でリモート MCP サーバーに接続します。

| フィールド                          | 説明                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | リモートサーバーの HTTP または HTTPS URL (必須)                |
| `headers`                      | HTTP ヘッダーの任意のキー値マップ (例: 認証トークン) |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト (ms、任意)                   |
| `connectTimeout`               | サーバーごとの接続タイムアウト (秒、任意)              |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト (秒または ms)                  |
| `auth: "oauth"`                | MCP OAuth トークンストレージと `openclaw mcp login` を使用             |
| `sslVerify`                    | 明示的に信頼されたプライベート HTTPS エンドポイントにのみ false を設定    |
| `clientCert` / `clientKey`     | mTLS クライアント証明書とキーのパス                            |
| `supportsParallelToolCalls`    | このサーバーで並行呼び出しが安全であることを示すヒント              |

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

`url` (userinfo) と `headers` 内の機密値は、ログとステータス出力で秘匿されます。`openclaw mcp doctor` は、機密情報に見える `headers` または `env` エントリにリテラル値が含まれている場合に警告するため、運用者はそれらの値をコミット済み設定の外へ移動できます。

### OAuth ワークフロー

OAuth は、MCP OAuth フローを通知する HTTP MCP サーバー向けです。`auth: "oauth"` が有効な間、そのサーバーの静的 `Authorization` ヘッダーは無視されます。

<Steps>
  <Step title="サーバーを保存">
    `auth: "oauth"` と任意の OAuth メタデータを指定して、サーバーを追加または更新します。

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="ログインを開始">
    ログインを実行して認可リクエストを作成します。

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw は認可 URL を出力し、一時的な OAuth 検証状態を OpenClaw 状態ディレクトリ配下に保存します。

  </Step>
  <Step title="コードで完了">
    ブラウザーで承認した後、返されたコードを OpenClaw に渡します。

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="認可を確認">
    トークンが存在することを確認するには、status または doctor を使用します。

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="認証情報をクリア">
    ログアウトは保存済みの OAuth 認証情報を削除しますが、保存済みのサーバー定義は保持します。

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

プロバイダーがトークンをローテーションする場合、または認可状態が詰まった場合は、`openclaw mcp logout <name>` を実行してから `login` を繰り返してください。`logout` は、サーバー名と URL が認証情報ストアのエントリを引き続き識別できる限り、設定から `auth: "oauth"` が削除された後でも、保存済み HTTP サーバーの認証情報をクリアできます。

### Streamable HTTP トランスポート

`streamable-http` は、`sse` および `stdio` と並ぶ追加のトランスポートオプションです。リモート MCP サーバーとの双方向通信に HTTP ストリーミングを使用します。

| フィールド                          | 説明                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | リモートサーバーの HTTP または HTTPS URL (必須)                                      |
| `transport`                    | このトランスポートを選択するには `"streamable-http"` に設定します。省略時、OpenClaw は `sse` を使用します |
| `headers`                      | HTTP ヘッダーの任意のキー値マップ (例: 認証トークン)                       |
| `connectionTimeoutMs`          | サーバーごとの接続タイムアウト (ms、任意)                                         |
| `connectTimeout`               | サーバーごとの接続タイムアウト (秒、任意)                                    |
| `timeout` / `requestTimeoutMs` | サーバーごとの MCP リクエストタイムアウト (秒または ms)                                        |
| `auth: "oauth"`                | MCP OAuth トークンストレージと `openclaw mcp login` を使用                                   |
| `sslVerify`                    | 明示的に信頼されたプライベート HTTPS エンドポイントにのみ false を設定                          |
| `clientCert` / `clientKey`     | mTLS クライアント証明書とキーのパス                                                  |
| `supportsParallelToolCalls`    | このサーバーで並行呼び出しが安全であることを示すヒント                                    |

OpenClaw 設定では、正規の綴りとして `transport: "streamable-http"` を使用します。CLI ネイティブの MCP `type: "http"` 値は、`openclaw mcp set` を通じて保存される場合は受け入れられ、既存設定では `openclaw doctor --fix` によって修復されますが、埋め込み OpenClaw が直接消費するのは `transport` です。

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
レジストリコマンドはチャンネルブリッジを開始しません。`probe` と `doctor --probe` のみがライブ MCP クライアントセッションを開き、対象サーバーに到達可能であることを証明します。
</Note>

## Control UI

ブラウザーの Control UI には、`/mcp` に専用の MCP 設定ページが含まれます。設定済みサーバー数、有効化/OAuth/フィルターの概要、サーバーごとのトランスポート行、有効化/無効化コントロール、一般的な CLI コマンド、`mcp` 設定セクション用のスコープ付きエディターが表示されます。

運用者による編集と簡易インベントリにはこのページを使用してください。ライブサーバーの証明が必要な場合は、`openclaw mcp doctor --probe` または `openclaw mcp probe` を使用してください。

運用者ワークフロー:

1. コントロール UI を開き、**MCP** を選択します。
2. 合計、有効、OAuth、フィルター済みサーバーの概要カードを確認します。
3. 各サーバー行で、トランスポート、認証、フィルター、タイムアウト、コマンドのヒントを確認します。
4. 定義は保持しつつランタイム検出から除外したい場合は、有効化を切り替えます。
5. 新しいサーバー、ヘッダー、TLS、OAuth メタデータ、ツールフィルターなどの構造的な変更には、スコープ付きの `mcp` config セクションを編集します。
6. config のみを永続化するには **保存** を、Gateway config パス経由で適用するには **保存して公開** を選択します。
7. 編集したサーバーが起動してツールを一覧表示することのライブ証明が必要な場合は、`openclaw mcp doctor --probe` を実行します。

注記:

- コマンドスニペットではサーバー名を引用符で囲むため、通常と異なる名前でもシェルにコピーできます
- 表示される URL のような値は、埋め込み認証情報を含む場合、レンダリング前に墨消しされます
- このページ自体は MCP トランスポートを開始しません
- アクティブなランタイムでは、どのプロセスが MCP クライアントを所有しているかに応じて、`openclaw mcp reload`、Gateway config の公開、またはプロセスの再起動が必要になる場合があります

## 現在の制限

このページは、現在出荷されているブリッジについて説明しています。

現在の制限:

- 会話検出は既存の Gateway セッションルートメタデータに依存します
- Claude 固有のアダプター以外に汎用プッシュプロトコルはありません
- メッセージ編集ツールやリアクションツールはまだありません
- HTTP/SSE/streamable-http トランスポートは単一のリモートサーバーに接続します。多重化されたアップストリームはまだありません
- `permissions_list_open` には、ブリッジ接続中に観測された承認のみが含まれます

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Plugin](/ja-JP/cli/plugins)
