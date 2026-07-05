---
read_when:
    - 実行承認または許可リストの設定
    - macOSアプリでexec承認UXを実装する
    - サンドボックスエスケープのプロンプトとその影響をレビューする
sidebarTitle: Exec approvals
summary: 'ホスト実行の承認: ポリシー調整項目、許可リスト、YOLO/厳格ワークフロー'
title: 実行の承認
x-i18n:
    generated_at: "2026-07-05T11:49:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ddbd4dc2229183fe5a9b12c5fe26e89c09f0259d9c929d37e1c3b85311123a2
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための **コンパニオンアプリ / Node ホストのガードレール**です。コマンドは、ポリシー + allowlist +（任意の）ユーザー承認がすべて一致した場合にのみ実行されます。承認はツールポリシーと昇格ゲートの**上に**重なります（昇格された `full` はそれらをスキップします）。

`deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian マッピング、ACPX ハーネス権限についてのモード優先の概要は、[権限モード](/ja-JP/tools/permission-modes)を参照してください。

<Note>
有効なポリシーは、`tools.exec.*` と承認のデフォルトのうち**より厳しい**ものです。承認は config 由来のセキュリティ/ask を厳しくすることだけができ、緩めることはできません。承認フィールドが省略された場合は、`tools.exec` の値が使われます。ホスト exec はそのマシン上のローカル承認状態も使用します。実行ホストの承認ファイルにホストローカルの `ask: "always"` がある場合、セッションまたは config のデフォルトが `ask: "on-miss"` を要求していても、プロンプトは継続されます。
</Note>

## 適用される場所

Exec 承認は実行ホスト上でローカルに強制されます。

- **Gateway ホスト** -> Gateway マシン上の `openclaw` プロセス。
- **Node ホスト** -> Node ランナー（macOS コンパニオンアプリまたはヘッドレス Node ホスト）。

### 信頼モデル

- Gateway で認証された呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリングされた Node は、その信頼されたオペレーター能力を Node ホストへ拡張します。
- 承認は偶発的な実行リスクを減らしますが、ユーザー単位の認可境界やファイルシステム読み取り専用ポリシーでは**ありません**。
- 承認後、コマンドは選択されたホストまたはサンドボックスのファイルシステム権限に従ってファイルを変更できます。
- 承認済みの Node ホスト実行は、正準実行コンテキスト（cwd、正確な argv、存在する場合の env バインディング、該当する場合の固定された実行可能ファイルパス）にバインドされます。
- シェルスクリプトおよびインタープリター/ランタイムファイルの直接呼び出しについては、OpenClaw は具体的なローカルファイルオペランドを 1 つバインドすることも試みます。そのファイルが承認後、実行前に変更された場合、ずれた内容を実行する代わりに実行は拒否されます。
- ファイルバインディングはベストエフォートであり、すべてのインタープリター/ランタイムローダーパスの完全なモデルではありません。具体的なローカルファイルを正確に 1 つ識別できない場合、OpenClaw は完全な網羅性を装うのではなく、承認に基づく実行の発行を拒否します。

### macOS の分離

- **Node ホストサービス**は、ローカル IPC 経由で `system.run` を **macOS アプリ**へ転送します。
- **macOS アプリ**は承認を強制し、UI コンテキストでコマンドを実行します。

## 有効なポリシーの確認

| コマンド                                                          | 表示内容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーソース、有効な結果。                       |
| `openclaw exec-policy show`                                      | ローカルマシンでマージされたビュー。                                                             |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたポリシーとローカルホスト承認ファイルを 1 ステップで同期します。 |

完全な CLI リファレンス（フラグ、JSON 出力、allowlist の追加/削除）: [承認 CLI](/ja-JP/cli/approvals)。

ローカルスコープが `host=node` を要求する場合、`exec-policy show` はローカル承認ファイルを信頼できるソースとして扱うのではなく、そのスコープを実行時に Node 管理として報告します。

コンパニオンアプリ UI が**利用できない**場合、通常であればプロンプトするリクエストはすべて **ask フォールバック**（デフォルト: `deny`）によって解決されます。

<Tip>
ネイティブチャット承認クライアントは、保留中の承認メッセージにチャネル固有の操作をシードできます。Matrix はリアクションショートカット（`✅` 1 回だけ許可、`♾️` 常に許可、`❌` 拒否）をシードしつつ、フォールバックとしてメッセージ内に `/approve ...` も残します。
</Tip>

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

`tools.exec.mode` は、ホスト exec 向けの推奨される正規化済みポリシーサーフェスです。

| 値       | 動作                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | ホスト exec をブロックします。                                                                                                                                                          |
| `allowlist` | allowlist 済みコマンドのみを、確認なしで実行します。                                                                                                                             |
| `ask`       | allowlist ポリシーを使用し、ミス時に確認します。                                                                                                                                   |
| `auto`      | allowlist ポリシーを使用し、決定的に一致したものを直接実行し、承認ミスは人間の承認ルートへフォールバックする前に OpenClaw のネイティブ自動レビュアーへ送ります。 |
| `full`      | 承認プロンプトなしでホスト exec を実行します。                                                                                                                                   |

レガシーの `tools.exec.security` / `tools.exec.ask` は引き続きサポートされており、そのスコープで `mode` が未設定の場合は引き続き適用されます。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - すべてのホスト exec リクエストをブロックします。
  - `allowlist` - allowlist 済みコマンドのみを許可します。
  - `full` - すべてを許可します（昇格と同等）。

デフォルトは Gateway/Node ホストでは `full` です。`sandbox` ホストでは代わりに `deny` がデフォルトです。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  ホスト exec 向けに設定された ask ポリシー。`tools.exec.ask` とホスト承認デフォルトからのベースライン承認プロンプト動作を制御します。デフォルトは `off` です。呼び出しごとの `ask` ツールパラメーター（[Exec ツール](/ja-JP/tools/exec#parameters)を参照）は、そのベースラインを厳格化することだけができ、チャネル由来のモデル呼び出しは、有効なホスト ask が `off` の場合これを無視します。

- `off` - プロンプトしません。
- `on-miss` - allowlist が一致しない場合のみプロンプトします。
- `always` - すべてのコマンドでプロンプトします。有効な ask モードが `always` の場合、`allow-always` の永続的信頼はプロンプトを抑制**しません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要だが UI に到達できない場合（またはプロンプトがタイムアウトした場合）の解決方法。省略時のデフォルトは `deny` です。

- `deny` - ブロックします。
- `allowlist` - allowlist が一致した場合のみ許可します。
- `full` - 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、インタープリターバイナリ自体が allowlist 済みであっても、インラインコード評価形式を承認必須として扱います。安定した 1 つのファイルオペランドにきれいに対応しないインタープリターローダーに対する多層防御です。
</ParamField>

strict モードが捕捉する例: `python -c`、`node -e`/`--eval`/`-p`、`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（`awk`、`sed`、`make`、`find -exec`、`xargs` のインライン形式も含む）。

strict モードでは、これらのコマンドには引き続き明示的な承認が必要であり、`allow-always` は新しい allowlist エントリを自動的には永続化しません。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  表示専用: 有効な場合、OpenClaw は Web 承認プロンプトがコマンドトークンをハイライトできるように、パーサー由来のコマンドスパンを付与する場合があります。`security`、`ask`、allowlist マッチング、strict inline-eval の動作、承認転送、またはコマンド実行は変更**しません**。
</ParamField>

グローバルには `tools.exec.commandHighlighting` の下で、またはエージェントごとには `agents.list[].tools.exec.commandHighlighting` の下で設定します。

## YOLO モード（承認なし）

承認プロンプトなしでホスト exec を実行するには、両方のポリシーレイヤーを開きます。OpenClaw config の要求 exec ポリシー（`tools.exec.*`）**と**実行ホスト承認ファイル内のホストローカル承認ポリシーです。

省略された `askFallback` のデフォルトは `deny` です。UI なし承認プロンプトを許可にフォールバックさせる必要がある場合は、ホスト `askFallback` を明示的に `full` に設定します。

| レイヤー                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホスト `askFallback`    | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は exec を実行する**場所**を選択します。利用可能な場合はサンドボックス、それ以外は Gateway です。
- YOLO はホスト exec が承認される**方法**を選択します。`security=full` と `ask=off` です。
- YOLO は、設定されたホスト exec ポリシーの上に、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前チェック拒否レイヤーを追加**しません**。
- `auto` は、サンドボックス化されたセッションから Gateway ルーティングを自由に上書きできるようにするものではありません。呼び出しごとの `host=node` リクエストは `auto` から許可されます。`host=gateway` は、アクティブなサンドボックスランタイムがない場合にのみ `auto` から許可されます。安定した非 auto のデフォルトにするには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用します。

</Warning>

独自の非対話型権限モードを公開する CLI バックエンドプロバイダーは、このポリシーに従うことができます。Claude CLI は、OpenClaw の有効な exec ポリシーが YOLO の場合、`--permission-mode bypassPermissions` を追加します。OpenClaw 管理の Claude ライブセッションでは、OpenClaw の有効な exec ポリシーが Claude のネイティブ権限モードより優先されます。YOLO はライブ起動を `--permission-mode bypassPermissions` に正規化し、制限的な有効 exec ポリシーは、raw Claude バックエンド引数が別のモードを指定していても、ライブ起動を `--permission-mode default` に正規化します。

より保守的なセットアップにしたい場合は、OpenClaw exec ポリシーを `allowlist` / `on-miss` または `deny` に戻して厳しくします。

### 永続的な Gateway ホストの「プロンプトしない」セットアップ

<Steps>
  <Step title="要求 config ポリシーを設定する">
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

ローカルの `tools.exec.host/security/ask` とローカル承認ファイルのデフォルト（`askFallback: "full"` を含む）の両方を更新します。これは意図的にローカル専用です。gateway ホストまたは node ホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node
<id|name|ip>` を使用します。

その他の組み込みプリセット: `cautious`（`host=gateway`、`security=allowlist`、
`ask=on-miss`、`askFallback=deny`）と `deny-all`（`host=gateway`、
`security=deny`、`ask=off`、`askFallback=deny`）。同じ方法で適用します:
`openclaw exec-policy preset cautious`。

完全なプリセットではなく個別フィールドを設定するには、
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` を、これらのフラグの任意のサブセットとともに使用します。

### Node ホスト

代わりに node 上で同じ承認ファイルを適用します:

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
- Node exec 承認は実行時に node から取得されるため、node を対象とする更新では `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションのみを変更します。
- `/elevated full` は、要求されたポリシーとホスト承認ファイルの両方が
  `security: "full"` と `ask: "off"` に解決される場合にのみ exec 承認をスキップする、緊急用ショートカットです。`ask:
"always"` のような、より厳格なホストファイルでは引き続き確認が表示されます。

ホスト承認ファイルが設定より厳格なままの場合、引き続きより厳格なホスト
ポリシーが優先されます。

## 許可リスト（エージェントごと）

許可リストは**エージェントごと**です。複数のエージェントが存在する場合は、macOS アプリで編集対象のエージェントを切り替えます。パターンは glob マッチです。

パターンには、解決済みバイナリパスの glob またはコマンド名のみの glob を指定できます。
名前のみの場合は `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合は `rg` が
`/opt/homebrew/bin/rg` に一致できますが、`./rg` や
`/tmp/rg` には**一致しません**。特定のバイナリ位置のみを信頼するには、パス glob を使用します。

従来の `agents.default` エントリは、読み込み時に `agents.main` へ移行されます。
`echo ok && pwd` のようなシェルチェーンでは、引き続き各トップレベルセグメントが
許可リスト規則を満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern で引数を制限する

許可リストエントリを、バイナリと特定の引数形状に一致させる必要がある場合は、`argPattern` を追加します。OpenClaw は、実行可能ファイルトークン（`argv[0]`）を除外した解析済みコマンド引数に対して正規表現を評価します。
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

このエントリは `python3 safe.py` を許可します。`python3 other.py` は許可リスト
ミスです。同じバイナリに対するパスのみのエントリも存在する場合、一致しない
引数は引き続きそのパスのみのエントリへフォールバックできます。目的がバイナリを宣言済み引数に制限することなら、パスのみの
エントリは省略してください。

承認フローで保存されたエントリは、厳密な argv マッチングのために内部区切り形式を使用します。
エンコードされた値を手で編集する代わりに、UI または承認フローでそれらのエントリを再生成することを推奨します。OpenClaw がコマンドセグメントの argv を解析できない場合、`argPattern` を持つエントリは一致しません。

各許可リストエントリは以下をサポートします:

| フィールド              | 意味                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 解決済みバイナリパス glob またはコマンド名のみの glob           |
| `argPattern`       | 任意の argv 正規表現。省略されたエントリはパスのみ            |
| `id`               | UI ID に使用される安定した UUID                              |
| `source`           | `allow-always` などのエントリソース                          |
| `commandText`      | 承認フローがエントリを作成したときにキャプチャされたコマンドテキスト |
| `lastUsedAt`       | 最終使用タイムスタンプ                                           |
| `lastUsedCommand`  | 最後に一致したコマンド                                     |
| `lastResolvedPath` | 最後に解決されたバイナリパス                                     |

## Skills CLI の自動許可

**Skills CLI の自動許可**（`autoAllowSkills`）が有効な場合、既知のスキルから参照される実行可能ファイルは、node（macOS node またはヘッドレス node ホスト）上で許可リスト登録済みとして扱われます。これは Gateway RPC 経由の `skills.bins` を使用して
スキル bin リストを取得します。厳格な手動
許可リストを使いたい場合は、これを無効にしてください。

<Warning>
- これは手動パス許可リストエントリとは別の、**暗黙の利便性許可リスト**です。
- Gateway と node が同じ信頼境界内にある、信頼済みオペレーター環境を想定しています。
- 厳格な明示的信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動パス許可リストエントリのみを使用してください。

</Warning>

## セーフ bin と承認転送

セーフ bin（stdin のみの高速パス）、インタープリターのバインディング詳細、および
承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、
[Exec 承認 - 高度](/ja-JP/tools/exec-approvals-advanced) を参照してください。

## Control UI での編集

デフォルト、エージェントごとの上書き、許可リストを編集するには、**Control UI -> Nodes -> Exec approvals** カードを使用します。スコープ（Defaults またはエージェント）を選択し、
ポリシーを調整し、許可リストパターンを追加/削除してから **Save** します。UI は
パターンごとの最終使用メタデータを表示するため、リストを整理できます。

ターゲットセレクターは **Gateway**（ローカル承認）または **Node** を選択します。
Node は `system.execApprovals.get/set`（macOS アプリまたはヘッドレス
node ホスト）を通知する必要があります。node がまだ exec 承認を通知していない場合は、その
ローカル承認ファイルを直接編集してください。

CLI: `openclaw approvals` は Gateway または node の編集をサポートします - 
[承認 CLI](/ja-JP/cli/approvals) を参照してください。

## 承認フロー

プロンプトが必要な場合、gateway は
`exec.approval.requested` をオペレータークライアントにブロードキャストします。Control UI と macOS
アプリは `exec.approval.resolve` 経由でそれを解決し、その後 gateway は
承認済みリクエストを node ホストに転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan`
ペイロードが含まれます。gateway は、承認済み `system.run` リクエストを転送する際、そのプランを権威ある command/cwd/session
コンテキストとして使用します:

- node exec パスは最初に 1 つの正規プランを準備します。
- 承認レコードはそのプランとそのバインディングメタデータを保存します。
- 承認後、最終的に転送される `system.run` 呼び出しは、後続の呼び出し元編集を信頼せず、保存済みプランを再利用します。
- 承認リクエストが作成された後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、gateway は転送された実行を承認不一致として拒否します。

## システムイベントと拒否

Exec ライフサイクルは、node が完了を報告した後、エージェントの
セッションに `Exec finished` システムメッセージを投稿します。OpenClaw は、
承認が付与された後に `tools.exec.approvalRunningNoticeMs` が経過すると（デフォルト `10000`、`0` で無効）進行中通知を発行することもできます。拒否された exec 承認はホストコマンドにとって終端です。コマンドは
実行されません。

- 発信元セッションがあるメインエージェントの非同期承認では、OpenClaw は
  その拒否を内部 followup としてそのセッションに投稿し、エージェントが
  非同期コマンドの待機を停止し、結果欠落の
  修復を避けられるようにします。
- セッションがない場合、またはセッションを再開できない場合でも、OpenClaw は
  オペレーターまたは直接チャットルートに簡潔な拒否を報告できます。
- サブエージェントと Cron セッションの拒否は、その
  セッションには投稿されません。

Gateway ホストの exec 承認は同じ完了ライフサイクルイベントを発行します。
承認でゲートされた exec は、承認 ID を再利用して保留中の
リクエストを完了/拒否メッセージ（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）と関連付けます。

## 影響

- **`full`** は強力です。可能な場合は許可リストを推奨します。
- **`ask`** は、高速な承認を許可しながらも確認ループに留めます。
- エージェントごとの許可リストは、あるエージェントの承認が他のエージェントに漏れるのを防ぎます。
- 承認は、**許可された送信者**からのホスト exec リクエストにのみ適用されます。許可されていない送信者は `/exec` を発行できません。
- `/exec security=full` は許可されたオペレーター向けのセッションレベルの利便機能であり、設計上承認をスキップします。ホスト exec を完全にブロックするには、承認 security を `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認 - 高度" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    セーフ bin、インタープリターのバインディング、チャットへの承認転送。
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
    各制御をいつ使うか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skill に基づく自動許可の動作。
  </Card>
</CardGroup>
