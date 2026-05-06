---
read_when:
    - exec の承認または許可リストを設定する
    - macOSアプリにおける exec 承認UXの実装
    - サンドボックス脱出プロンプトとその影響をレビューする
sidebarTitle: Exec approvals
summary: 'ホスト実行の承認: ポリシー調整項目、許可リスト、YOLO/厳格ワークフロー'
title: 実行の承認
x-i18n:
    generated_at: "2026-05-06T05:21:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための **コンパニオンアプリ / node ホストのガードレール**です。安全インターロックとして、コマンドはポリシー + allowlist + （任意の）ユーザー承認がすべて一致した場合にのみ許可されます。Exec 承認は、ツールポリシーと昇格ゲートの**上に**積み重なります（ただし、昇格が `full` に設定されている場合は承認をスキップします）。

<Note>
有効なポリシーは、`tools.exec.*` と承認のデフォルトのうち**より厳しい**ものです。承認フィールドが省略された場合は、`tools.exec` の値が使用されます。ホスト exec は、そのマシン上のローカル承認状態も使用します。`~/.openclaw/exec-approvals.json` 内のホストローカルな `ask: "always"` は、セッションまたは設定のデフォルトが `ask: "on-miss"` を要求していても、プロンプトを出し続けます。
</Note>

## 有効なポリシーの確認

| コマンド                                                          | 表示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーのソース、有効な結果。                               |
| `openclaw exec-policy show`                                      | ローカルマシンのマージ済みビュー。                                                     |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたポリシーを、ローカルホストの承認ファイルと 1 ステップで同期します。 |

ローカルスコープが `host=node` を要求すると、`exec-policy show` はローカル承認ファイルを信頼できる唯一のソースであるかのように扱うのではなく、そのスコープを実行時に node 管理として報告します。

コンパニオンアプリ UI が**利用できない**場合、通常ならプロンプトが表示されるリクエストはすべて **ask fallback**（デフォルト: `deny`）で解決されます。

<Tip>
ネイティブチャット承認クライアントは、保留中の承認メッセージにチャネル固有の操作を事前設定できます。たとえば Matrix はリアクションショートカット（`✅` 1 回許可、`❌` 拒否、`♾️` 常に許可）を事前設定しつつ、フォールバックとしてメッセージ内に `/approve ...` コマンドも残します。
</Tip>

## 適用される場所

Exec 承認は実行ホスト上でローカルに適用されます。

- **Gateway ホスト** → Gateway マシン上の `openclaw` プロセス。
- **Node ホスト** → node ランナー（macOS コンパニオンアプリまたはヘッドレス node ホスト）。

### 信頼モデル

- Gateway 認証済みの呼び出し元は、その Gateway の信頼済みオペレーターです。
- ペアリング済み node は、その信頼済みオペレーター権限を node ホストへ拡張します。
- Exec 承認は偶発的な実行リスクを低減しますが、ユーザーごとの認証境界では**ありません**。
- 承認済みの node ホスト実行は、正規の実行コンテキストをバインドします。正規 cwd、正確な argv、存在する場合は env バインド、該当する場合は固定された実行可能ファイルパスです。
- シェルスクリプトと、インタープリター / ランタイムファイルの直接呼び出しについて、OpenClaw は具体的なローカルファイルオペランドを 1 つバインドすることも試みます。そのバインドされたファイルが承認後かつ実行前に変更された場合、ずれた内容を実行する代わりに、その実行は拒否されます。
- ファイルバインドは意図的にベストエフォートであり、あらゆるインタープリター / ランタイムローダーパスの完全な意味モデルでは**ありません**。承認モードがバインド対象の具体的なローカルファイルを正確に 1 つ識別できない場合、完全なカバレッジを装うのではなく、承認に裏付けられた実行の発行を拒否します。

### macOS 分割

- **node ホストサービス**は、ローカル IPC 経由で `system.run` を **macOS アプリ**へ転送します。
- **macOS アプリ**が承認を適用し、UI コンテキストでコマンドを実行します。

## 設定と保存場所

承認は実行ホスト上のローカル JSON ファイルに保存されます。

```text
~/.openclaw/exec-approvals.json
```

スキーマ例:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## ポリシーの調整項目

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - すべてのホスト exec リクエストをブロックします。
  - `allowlist` - allowlist に登録されたコマンドのみを許可します。
  - `full` - すべてを許可します（昇格と同等）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - プロンプトを表示しません。
  - `on-miss` - allowlist に一致しない場合のみプロンプトを表示します。
  - `always` - すべてのコマンドでプロンプトを表示します。有効な ask モードが `always` の場合、`allow-always` の永続的な信頼はプロンプトを**抑制しません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要だが UI に到達できない場合の解決方法。

- `deny` - ブロックします。
- `allowlist` - allowlist に一致する場合のみ許可します。
- `full` - 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、OpenClaw はインタープリターバイナリ自体が allowlist に登録されていても、インラインコード評価形式を承認必須として扱います。安定した 1 つのファイルオペランドへきれいに対応しないインタープリターローダーに対する多層防御です。
</ParamField>

strict モードが検出する例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

strict モードでは、これらのコマンドは引き続き明示的な承認が必要であり、`allow-always` は新しい allowlist エントリを自動的に永続化しません。

## YOLO モード（承認なし）

承認プロンプトなしでホスト exec を実行したい場合は、**両方の**ポリシーレイヤーを開く必要があります。OpenClaw 設定の要求 exec ポリシー（`tools.exec.*`）**および** `~/.openclaw/exec-approvals.json` のホストローカル承認ポリシーです。

明示的に厳しくしない限り、YOLO がデフォルトのホスト動作です。

| レイヤー              | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホスト `askFallback`  | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は exec を**どこで**実行するかを選びます。利用可能ならサンドボックス、そうでなければ Gateway です。
- YOLO はホスト exec を**どのように**承認するかを選びます。`security=full` と `ask=off` です。
- YOLO モードでは、OpenClaw は設定済みのホスト exec ポリシーの上に、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前拒否レイヤーを追加**しません**。
- `auto` は、サンドボックス化されたセッションから Gateway ルーティングを自由に上書きできるようにはしません。`auto` からの呼び出しごとの `host=node` リクエストは許可されます。`host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ `auto` から許可されます。安定した非 auto のデフォルトにするには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用します。

</Warning>

独自の非対話型権限モードを公開する CLI ベースのプロバイダーは、このポリシーに従うことができます。Claude CLI は、OpenClaw の要求 exec ポリシーが YOLO の場合に `--permission-mode bypassPermissions` を追加します。そのバックエンド動作を上書きするには、`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` の下で明示的な Claude 引数を指定します。たとえば `--permission-mode default`、`acceptEdits`、または `bypassPermissions` です。

より保守的な設定にしたい場合は、いずれかのレイヤーを `allowlist` / `on-miss` または `deny` に戻して厳しくします。

### 永続的な Gateway ホストの「プロンプトしない」設定

<Steps>
  <Step title="要求される設定ポリシーを設定する">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ホスト承認ファイルを一致させる">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### ローカルショートカット

```bash
openclaw exec-policy preset yolo
```

このローカルショートカットは次の両方を更新します。

- ローカルの `tools.exec.host/security/ask`。
- ローカルの `~/.openclaw/exec-approvals.json` デフォルト。

これは意図的にローカル専用です。Gateway ホストまたは node ホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を使用します。

### Node ホスト

node ホストの場合は、代わりに同じ承認ファイルをその node に適用します。

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**ローカル専用の制限:**

- `openclaw exec-policy` は node 承認を同期しません。
- `openclaw exec-policy set --host node` は拒否されます。
- Node exec 承認は実行時に node から取得されるため、node を対象とする更新には `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションのみを変更します。
- `/elevated full` は、そのセッションの exec 承認もスキップする緊急用ショートカットです。

ホスト承認ファイルが設定より厳しいままの場合、より厳しいホストポリシーが引き続き優先されます。

## Allowlist（エージェントごと）

Allowlists は**エージェントごと**です。複数のエージェントが存在する場合は、macOS アプリで編集対象のエージェントを切り替えます。パターンは glob マッチです。

パターンには、解決済みバイナリパス glob または裸のコマンド名 glob を指定できます。裸の名前は `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には**一致しません**。特定のバイナリ場所を信頼したい場合は、パス glob を使用します。

レガシーな `agents.default` エントリは読み込み時に `agents.main` へ移行されます。`echo ok && pwd` のようなシェルチェーンでも、各トップレベルセグメントが allowlist ルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern による引数の制限

allowlist エントリをバイナリと特定の引数形状に一致させる必要がある場合は、`argPattern` を追加します。OpenClaw は、実行可能ファイルトークン（`argv[0]`）を除外した解析済みコマンド引数に対して正規表現を評価します。手書きのエントリでは、引数は単一スペースで結合されるため、完全一致が必要な場合はパターンをアンカーします。

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

このエントリは `python3 safe.py` を許可します。`python3 other.py` は allowlist ミスです。同じバイナリに対するパスのみのエントリも存在する場合、一致しない引数は引き続きそのパスのみのエントリへフォールバックできます。目的がバイナリを宣言済み引数に制限することなら、パスのみのエントリは省略してください。

承認フローによって保存されたエントリは、正確な argv マッチングのために内部セパレーター形式を使用する場合があります。エンコードされた値を手で編集する代わりに、UI または承認フローでそれらのエントリを再生成することを推奨します。OpenClaw がコマンドセグメントの argv を解析できない場合、`argPattern` を持つエントリは一致しません。

各 allowlist エントリがサポートするもの:

| フィールド       | 意味                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 解決済みバイナリパスの glob、または単体のコマンド名 glob |
| `argPattern`       | 任意の argv 正規表現。省略されたエントリはパスのみ |
| `id`               | UI 識別に使われる安定した UUID |
| `source`           | `allow-always` などのエントリソース |
| `commandText`      | 承認フローがエントリを作成したときに取得されたコマンドテキスト |
| `lastUsedAt`       | 最後に使用されたタイムスタンプ |
| `lastUsedCommand`  | 最後に一致したコマンド |
| `lastResolvedPath` | 最後に解決されたバイナリパス |

## Skills CLI の自動許可

**Skills CLI の自動許可**が有効な場合、既知の Skills から参照される実行可能ファイルは、ノード（macOS ノードまたはヘッドレスノードホスト）上で許可リスト登録済みとして扱われます。これは Gateway RPC 経由で `skills.bins` を使用し、Skill バイナリリストを取得します。厳格な手動許可リストを使いたい場合は、これを無効にしてください。

<Warning>
- これは手動パス許可リストエントリとは別の、**暗黙的な利便性のための許可リスト**です。
- Gateway とノードが同じ信頼境界内にある、信頼済みオペレーター環境を想定しています。
- 厳格で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動パス許可リストエントリのみを使用してください。

</Warning>

## 安全なバイナリと承認転送

安全なバイナリ（標準入力のみの高速パス）、インタープリターバインディングの詳細、承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、[Exec 承認 - 高度](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

**Control UI → Nodes → Exec approvals** カードを使用して、デフォルト、エージェントごとの上書き、許可リストを編集します。スコープ（デフォルトまたはエージェント）を選び、ポリシーを調整し、許可リストパターンを追加または削除してから、**Save** します。UI にはパターンごとの最終使用メタデータが表示されるため、リストを整理した状態に保てます。

ターゲットセレクターでは、**Gateway**（ローカル承認）または **Node** を選択します。ノードは `system.execApprovals.get/set`（macOS アプリまたはヘッドレスノードホスト）を広告する必要があります。ノードがまだ exec 承認を広告していない場合は、そのローカルの `~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は Gateway またはノードの編集をサポートします。[承認 CLI](/ja-JP/cli/approvals)を参照してください。

## 承認フロー

プロンプトが必要な場合、Gateway は `exec.approval.requested` をオペレータークライアントにブロードキャストします。Control UI と macOS アプリは `exec.approval.resolve` 経由でそれを解決し、その後 Gateway が承認済みリクエストをノードホストへ転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan` ペイロードが含まれます。Gateway は、承認済みの `system.run` リクエストを転送する際、そのプランをコマンド/cwd/セッションコンテキストの権威ある情報として使用します。

これは非同期承認のレイテンシに関係します。

- ノード exec パスは、最初に 1 つの正規プランを準備します。
- 承認レコードは、そのプランとバインディングメタデータを保存します。
- 承認されると、最後に転送される `system.run` 呼び出しは、後続の呼び出し元による編集を信頼する代わりに、保存済みのプランを再利用します。
- 承認リクエスト作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は転送される実行を承認不一致として拒否します。

## システムイベント

Exec ライフサイクルはシステムメッセージとして表示されます。

- `Exec running`（コマンドが実行中通知しきい値を超えた場合のみ）。
- `Exec finished`。
- `Exec denied`。

これらは、ノードがイベントを報告した後にエージェントのセッションへ投稿されます。Gateway ホストの exec 承認は、コマンド完了時（および任意で、しきい値より長く実行中の場合）に同じライフサイクルイベントを発行します。承認で制御された exec は、これらのメッセージで承認 ID を `runId` として再利用し、関連付けを簡単にします。

## 拒否された承認の動作

非同期 exec 承認が拒否された場合、OpenClaw は、エージェントが同じセッション内の同じコマンドの以前の実行結果を再利用できないようにします。拒否理由には、コマンド出力が利用できないことを示す明示的なガイダンスが付与されます。これにより、エージェントが新しい出力があると主張したり、以前に成功した実行の古い結果を使って拒否されたコマンドを繰り返したりすることを防ぎます。

## 影響

- **`full`** は強力です。可能な場合は許可リストを優先してください。
- **`ask`** はユーザーをループ内に保ちながら、高速な承認も可能にします。
- エージェントごとの許可リストにより、あるエージェントの承認が他のエージェントへ漏れるのを防ぎます。
- 承認は、**認可済み送信者**からのホスト exec リクエストにのみ適用されます。未認可の送信者は `/exec` を発行できません。
- `/exec security=full` は認可済みオペレーター向けのセッションレベルの利便性機能であり、設計上、承認をスキップします。ホスト exec を強制的にブロックするには、承認セキュリティを `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認 - 高度" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    安全なバイナリ、インタープリターバインディング、チャットへの承認転送。
  </Card>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    シェルコマンド実行ツール。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認もスキップする緊急用パス。
  </Card>
  <Card title="サンドボックス化" href="/ja-JP/gateway/sandboxing" icon="box">
    サンドボックスモードとワークスペースアクセス。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security" icon="lock">
    セキュリティモデルと強化。
  </Card>
  <Card title="サンドボックス vs ツールポリシー vs 昇格" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    各制御をいつ使うべきか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skills に基づく自動許可動作。
  </Card>
</CardGroup>
