---
read_when:
    - exec 承認または許可リストの設定
    - macOSアプリでexec承認UXを実装する
    - サンドボックス脱出プロンプトとその影響のレビュー
sidebarTitle: Exec approvals
summary: 'ホスト exec 承認: ポリシーノブ、許可リスト、YOLO/strict ワークフロー'
title: 実行承認
x-i18n:
    generated_at: "2026-06-27T13:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための **コンパニオンアプリ / Node ホストのガードレール**です。安全インターロックとして、コマンドはポリシー + 許可リスト +（任意の）ユーザー承認がすべて一致した場合にのみ許可されます。Exec 承認は、ツールポリシーと昇格ゲートの**上に**重なります（ただし、昇格が `full` に設定されている場合は承認をスキップします）。

`deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian マッピング、ACPX ハーネス権限のモード優先の概要については、[権限モード](/ja-JP/tools/permission-modes)を参照してください。

<Note>
有効なポリシーは、`tools.exec.*` と承認デフォルトのうち**より厳しい**ものです。承認フィールドが省略された場合は、`tools.exec` の値が使用されます。ホスト exec は、そのマシン上のローカル承認状態も使用します。実行ホストの承認ファイルにあるホストローカルの `ask: "always"` は、セッションまたは設定デフォルトが `ask: "on-miss"` を要求していてもプロンプトを出し続けます。
</Note>

## 有効なポリシーの確認

| コマンド                                                          | 表示内容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーのソース、有効な結果。                       |
| `openclaw exec-policy show`                                      | ローカルマシンのマージ済みビュー。                                                             |
| `openclaw exec-policy set` / `preset`                            | ローカルの要求ポリシーとローカルホスト承認ファイルを 1 ステップで同期します。 |

ローカルスコープが `host=node` を要求する場合、`exec-policy show` は、そのスコープについて、ローカル承認ファイルを真実のソースであるかのように扱うのではなく、実行時に Node 管理として報告します。

コンパニオンアプリ UI が**利用できない**場合、通常ならプロンプトを出すリクエストはすべて **ask フォールバック**（デフォルト: `deny`）で解決されます。

<Tip>
ネイティブチャット承認クライアントは、保留中の承認メッセージにチャネル固有の操作をシードできます。たとえば Matrix はリアクションショートカット（`✅` 1 回だけ許可、`❌` 拒否、`♾️` 常に許可）をシードしつつ、フォールバックとしてメッセージ内に `/approve ...` コマンドを残します。
</Tip>

## 適用範囲

Exec 承認は、実行ホスト上でローカルに適用されます。

- **Gateway ホスト** → Gateway マシン上の `openclaw` プロセス。
- **Node ホスト** → Node ランナー（macOS コンパニオンアプリまたはヘッドレス Node ホスト）。

### 信頼モデル

- Gateway で認証された呼び出し元は、その Gateway の信頼済みオペレーターです。
- ペアリングされた Node は、その信頼済みオペレーター機能を Node ホストへ拡張します。
- Exec 承認は偶発的な実行リスクを低減しますが、**ユーザーごとの認証境界**でも、ファイルシステムの読み取り専用ポリシーでもありません。
- 承認されると、コマンドは選択されたホストまたはサンドボックスのファイルシステム権限に従ってファイルを変更できます。
- 承認済みの Node ホスト実行は、正規の実行コンテキストをバインドします。正規 cwd、正確な argv、存在する場合の env バインド、該当する場合の固定された実行可能ファイルパスです。
- シェルスクリプトおよびインタープリター/ランタイムファイルの直接呼び出しについて、OpenClaw は具体的なローカルファイルオペランドも 1 つバインドしようとします。そのバインドされたファイルが承認後、実行前に変更された場合、実行は変化した内容を実行する代わりに拒否されます。
- ファイルバインドは意図的にベストエフォートであり、すべてのインタープリター/ランタイムローダーパスの完全なセマンティックモデルでは**ありません**。承認モードがバインド対象の具体的なローカルファイルをちょうど 1 つ特定できない場合、完全なカバレッジを装うのではなく、承認に裏付けられた実行の発行を拒否します。

### macOS の分離

- **Node ホストサービス**は `system.run` を local IPC 経由で **macOS アプリ**へ転送します。
- **macOS アプリ**は承認を適用し、UI コンテキストでコマンドを実行します。

## 設定とストレージ

承認は実行ホスト上のローカル JSON ファイルに保存されます。`OPENCLAW_STATE_DIR` が設定されている場合、ファイルはその状態ディレクトリに従います。そうでない場合は、デフォルトの OpenClaw 状態ディレクトリを使用します。

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

デフォルトの承認ソケットは同じルートに従います。
`$OPENCLAW_STATE_DIR/exec-approvals.sock`、または変数が未設定の場合は
`~/.openclaw/exec-approvals.sock` です。

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

## ポリシーノブ

### `tools.exec.mode`

`tools.exec.mode` は、ホスト exec 向けの推奨される正規化済みポリシーサーフェスです。値は次のとおりです。

- `deny` - ホスト exec をブロックします。
- `allowlist` - 確認なしで、許可リスト登録済みコマンドのみを実行します。
- `ask` - 許可リストポリシーを使用し、ミス時に確認します。
- `auto` - 許可リストポリシーを使用し、決定的な一致は直接実行し、承認ミスは人間の承認ルートへフォールバックする前に OpenClaw のネイティブ自動レビュー担当へ送信します。
- `full` - 承認プロンプトなしでホスト exec を実行します。

レガシーの `tools.exec.security` / `tools.exec.ask` は引き続きサポートされ、より狭いセッションまたはエージェントスコープで設定された場合は今でも優先されます。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - すべてのホスト exec リクエストをブロックします。
  - `allowlist` - 許可リスト登録済みコマンドのみを許可します。
  - `full` - すべてを許可します（昇格と同等）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  ホスト exec に設定された ask ポリシーです。`tools.exec.ask` とホスト承認デフォルトからのベースライン承認プロンプト動作を制御します。呼び出しごとの `ask` ツールパラメーター（[Exec ツール](/ja-JP/tools/exec#parameters)を参照）は、そのベースラインを厳格化することしかできず、チャネル由来のモデル呼び出しは、有効なホスト ask が `off` の場合これを無視します。

- `off` - プロンプトを表示しません。
- `on-miss` - 許可リストに一致しない場合のみプロンプトを表示します。
- `always` - すべてのコマンドでプロンプトを表示します。有効な ask モードが `always` の場合、`allow-always` の永続的な信頼はプロンプトを**抑制しません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要だが UI に到達できない場合の解決方法です。このフィールドが省略された場合、OpenClaw はデフォルトで `deny` になります。

- `deny` - ブロックします。
- `allowlist` - 許可リストに一致する場合のみ許可します。
- `full` - 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、OpenClaw は、インタープリターバイナリ自体が許可リストに登録されていても、インラインコード評価形式を承認専用として扱います。安定した 1 つのファイルオペランドにきれいに対応しないインタープリターローダーに対する多層防御です。
</ParamField>

厳格モードで検出される例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

厳格モードでは、これらのコマンドには引き続き明示的な承認が必要であり、`allow-always` はそれらに対して新しい許可リストエントリを自動的に永続化しません。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Exec 承認プロンプトでの表示のみを制御します。有効にすると、OpenClaw はパーサー由来のコマンド範囲を添付し、Web 承認プロンプトでコマンドトークンをハイライトできるようにします。コマンドテキストのハイライトを有効にするには `true` に設定します。
</ParamField>

この設定は、`security`、`ask`、許可リスト照合、厳格インライン評価動作、承認転送、コマンド実行を**変更しません**。グローバルには `tools.exec.commandHighlighting` 配下で、エージェントごとには `agents.list[].tools.exec.commandHighlighting` 配下で設定できます。

## YOLO モード（承認なし）

承認プロンプトなしでホスト exec を実行したい場合は、**両方の**ポリシーレイヤーを開く必要があります。OpenClaw 設定の要求 exec ポリシー（`tools.exec.*`）**と**、実行ホスト承認ファイル内のホストローカル承認ポリシーです。

OpenClaw は省略された `askFallback` をデフォルトで `deny` にします。UI なしの承認プロンプトを許可へフォールバックさせる必要がある場合は、ホストの `askFallback` を明示的に `full` に設定してください。

| レイヤー                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホスト `askFallback`    | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は exec を**どこで**実行するかを選びます。サンドボックスが利用可能な場合はサンドボックス、そうでなければ Gateway です。
- YOLO はホスト exec を**どのように**承認するかを選びます。`security=full` に加えて `ask=off` です。
- YOLO モードでは、OpenClaw は設定済みのホスト exec ポリシーの上に、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前確認拒否レイヤーを追加しません。
- `auto` は、サンドボックス化されたセッションから Gateway ルーティングを自由に上書きできるようにはしません。呼び出しごとの `host=node` リクエストは `auto` から許可されます。`host=gateway` は、サンドボックスランタイムがアクティブでない場合にのみ `auto` から許可されます。安定した非 auto デフォルトにするには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。

</Warning>

独自の非対話型権限モードを公開する CLI ベースのプロバイダーは、このポリシーに従えます。Claude CLI は、OpenClaw の有効な exec ポリシーが YOLO の場合に `--permission-mode bypassPermissions` を追加します。OpenClaw 管理の Claude ライブセッションでは、Claude のネイティブ権限モードよりも OpenClaw の有効な exec ポリシーが優先されます。YOLO はライブ起動を `--permission-mode bypassPermissions` に正規化し、制限的な有効 exec ポリシーは、未加工の Claude バックエンド引数が別のモードを指定していても、ライブ起動を `--permission-mode default` に正規化します。

より保守的なセットアップにしたい場合は、OpenClaw exec ポリシーを `allowlist` / `on-miss` または `deny` に戻して厳格化してください。

### 永続的な Gateway ホストの「プロンプトを出さない」セットアップ

<Steps>
  <Step title="要求された設定ポリシーを設定する">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ホスト承認ファイルを合わせる">
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

そのローカルショートカットは次の両方を更新します。

- ローカルの `tools.exec.host/security/ask`。
- `askFallback: "full"` を含むローカル承認ファイルのデフォルト。

これは意図的にローカル専用です。Gateway ホストまたは Node ホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を使用してください。

### Node ホスト

Node ホストの場合は、代わりにその Node に同じ承認ファイルを適用します。

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

- `openclaw exec-policy` は Node 承認を同期しません。
- `openclaw exec-policy set --host node` は拒否されます。
- Node exec 承認は実行時に Node から取得されるため、Node 向けの更新には `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションだけを変更します。
- `/elevated full` は、要求されたポリシーとホスト承認ファイルの両方が
  `security: "full"` と `ask: "off"` に解決される場合にのみ exec 承認をスキップする、
  緊急時用ショートカットです。`ask: "always"` など、より厳格なホストファイルでは、
  それでもプロンプトが表示されます。

ホスト承認ファイルが設定より厳格なままの場合、より厳格なホスト
ポリシーが引き続き優先されます。

## 許可リスト（エージェント単位）

許可リストは**エージェント単位**です。複数のエージェントが存在する場合は、macOS アプリで
編集対象のエージェントを切り替えます。パターンは glob マッチです。

パターンには、解決済みバイナリパスの glob、または裸のコマンド名 glob を指定できます。
裸の名前は `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、
`rg` は `/opt/homebrew/bin/rg` に一致できますが、**`./rg` や
`/tmp/rg` には一致しません**。特定のバイナリ
場所だけを信頼したい場合は、パス glob を使用してください。

従来の `agents.default` エントリは、読み込み時に `agents.main` へ移行されます。
`echo ok && pwd` のようなシェルチェーンでも、最上位の各セグメントが
許可リストルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern による引数の制限

許可リストエントリを、バイナリと特定の引数形状に一致させたい場合は、
`argPattern` を追加します。OpenClaw は、実行可能ファイルトークン
（`argv[0]`）を除いた、解析済みコマンド引数に対して正規表現を評価します。
手書きのエントリでは、引数は単一スペースで結合されるため、完全一致が必要な場合は
パターンをアンカーしてください。

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

このエントリは `python3 safe.py` を許可します。`python3 other.py` は許可リストに
一致しません。同じバイナリに対するパスのみのエントリも存在する場合、一致しない
引数はそのパスのみのエントリへフォールバックできます。目的が、そのバイナリを宣言済みの引数に
制限することである場合は、パスのみのエントリを省略してください。

承認フローによって保存されたエントリでは、正確な argv マッチングのために内部セパレーター形式を
使用することがあります。エンコードされた値を手で編集するのではなく、UI または承認フローで
それらのエントリを再生成することを推奨します。OpenClaw がコマンドセグメントの argv を
解析できない場合、`argPattern` を持つエントリは一致しません。

各許可リストエントリは次をサポートします。

| フィールド         | 意味                                                         |
| ------------------ | ------------------------------------------------------------ |
| `pattern`          | 解決済みバイナリパス glob または裸のコマンド名 glob          |
| `argPattern`       | 任意の argv 正規表現。省略されたエントリはパスのみ           |
| `id`               | UI の同一性に使用される安定した UUID                         |
| `source`           | `allow-always` などのエントリソース                          |
| `commandText`      | 承認フローがエントリを作成したときに取得されたコマンドテキスト |
| `lastUsedAt`       | 最終使用タイムスタンプ                                      |
| `lastUsedCommand`  | 最後に一致したコマンド                                      |
| `lastResolvedPath` | 最後に解決されたバイナリパス                                |

## Skill CLI の自動許可

**Skill CLI の自動許可**が有効な場合、既知の Skills によって参照される実行可能ファイルは、
ノード（macOS ノードまたはヘッドレスノードホスト）上で許可リスト済みとして扱われます。
これは Gateway RPC 経由で `skills.bins` を使用し、Skill の bin リストを取得します。
厳格な手動許可リストを使いたい場合は、これを無効にしてください。

<Warning>
- これは、手動パス許可リストエントリとは別の、**暗黙的な利便性のための許可リスト**です。
- Gateway とノードが同じ信頼境界内にある、信頼済みオペレーター環境を想定しています。
- 厳格で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにして、手動パス許可リストエントリのみを使用してください。

</Warning>

## 安全な bin と承認転送

安全な bin（stdin のみの高速パス）、インタープリターのバインディング詳細、
および承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、
[Exec 承認 - 詳細](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

**Control UI → Nodes → Exec approvals** カードを使用して、デフォルト、
エージェント単位のオーバーライド、許可リストを編集します。スコープ（Defaults またはエージェント）を選び、
ポリシーを調整し、許可リストパターンを追加または削除してから **Save** します。UI は
パターンごとに最終使用メタデータを表示するため、リストを整理して保てます。

ターゲットセレクターは **Gateway**（ローカル承認）または **Node** を選択します。
ノードは `system.execApprovals.get/set`（macOS アプリまたは
ヘッドレスノードホスト）を広告する必要があります。ノードがまだ exec 承認を広告していない場合は、
そのローカル承認ファイルを直接編集してください。

CLI: `openclaw approvals` は Gateway またはノードの編集をサポートします -
[Approvals CLI](/ja-JP/cli/approvals)を参照してください。

## 承認フロー

プロンプトが必要な場合、gateway は
`exec.approval.requested` をオペレータークライアントへブロードキャストします。Control UI と macOS
アプリは `exec.approval.resolve` でそれを解決し、その後 gateway は承認済みリクエストを
ノードホストへ転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan`
ペイロードが含まれます。gateway は、承認済み `system.run`
リクエストを転送するときに、そのプランを権威ある
command/cwd/session コンテキストとして使用します。

これは非同期承認レイテンシにとって重要です。

- ノード exec パスは、最初に 1 つの正規プランを準備します。
- 承認レコードは、そのプランとそのバインディングメタデータを保存します。
- 承認されると、最終的に転送される `system.run` 呼び出しは、後からの呼び出し元の編集を信頼する代わりに、保存されたプランを再利用します。
- 承認リクエスト作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、gateway は転送された実行を承認不一致として拒否します。

## システムイベント

Exec ライフサイクルはシステムメッセージとして表示されます。

- `Exec running`（コマンドが実行中通知のしきい値を超えた場合のみ）。
- `Exec finished`。

これらは、ノードがイベントを報告した後にエージェントのセッションへ投稿されます。
拒否された exec 承認は、ホストコマンド自体にとって終端です。コマンドは
実行されません。発信元セッションがあるメインエージェントの非同期承認では、
OpenClaw は拒否を内部フォローアップとしてそのセッションへ投稿し、
エージェントが非同期コマンドの待機を止め、結果欠落の修復を避けられるようにします。
セッションが存在しない、またはセッションを再開できない場合でも、OpenClaw は
簡潔な拒否をオペレーターまたは直接チャットルートへ報告できます。サブエージェントセッションの
拒否は、サブエージェントへ投稿されません。
Gateway ホストの exec 承認は、コマンド完了時（および任意で、しきい値より長く実行中の場合）に
同じライフサイクルイベントを発行します。
承認で制御された exec は、容易に関連付けられるよう、これらの
メッセージ内で承認 ID を `runId` として再利用します。

## 拒否された承認の動作

非同期 exec 承認が拒否された場合、OpenClaw はホストコマンドを
終端かつ fail-closed として扱います。メインエージェントセッションでは、拒否は
内部セッションフォローアップとして配信され、非同期コマンドが実行されなかったことをエージェントに伝えます。
これにより、古いコマンド出力を露出せずにトランスクリプトの連続性を保ちます。セッション配信が
利用できない場合、OpenClaw は安全なルートが存在するときに、簡潔なオペレーターまたは
直接チャットでの拒否へフォールバックします。

## 影響

- **`full`** は強力です。可能な場合は許可リストを推奨します。
- **`ask`** は、迅速な承認を可能にしながら、ユーザーを判断ループ内に保ちます。
- エージェント単位の許可リストは、あるエージェントの承認が他へ漏れることを防ぎます。
- 承認は、**認可済み送信者**からのホスト exec リクエストにのみ適用されます。未認可の送信者は `/exec` を発行できません。
- `/exec security=full` は認可済みオペレーター向けのセッションレベルの利便機能であり、設計上、承認をスキップします。ホスト exec を強制的にブロックするには、承認 security を `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認 - 詳細" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    安全な bin、インタープリターバインディング、チャットへの承認転送。
  </Card>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    シェルコマンド実行ツール。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認もスキップする緊急時用パス。
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
    Skill による自動許可の動作。
  </Card>
</CardGroup>
