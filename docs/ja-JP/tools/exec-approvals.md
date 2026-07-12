---
read_when:
    - exec 承認または許可リストの設定
    - macOS アプリでの exec 承認 UX の実装
    - サンドボックス脱出を促すプロンプトとその影響の検討
sidebarTitle: Exec approvals
summary: ホストでのコマンド実行の承認：ポリシー設定、許可リスト、YOLO／厳格ワークフロー
title: 実行の承認
x-i18n:
    generated_at: "2026-07-11T22:45:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための、**コンパニオンアプリ / Node ホストのガードレール**です。コマンドは、ポリシー + 許可リスト +（任意の）ユーザー承認のすべてが一致した場合にのみ実行されます。承認は、ツールポリシーと昇格ゲートの**上に重ねて**適用されます（昇格 `full` ではスキップされます）。

`deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian のマッピング、ACPX ハーネスの権限について、モードを中心とした概要は[権限モード](/ja-JP/tools/permission-modes)を参照してください。

<Note>
有効なポリシーは、`tools.exec.*` と承認のデフォルトのうち、**より厳しい**方です。承認で強化できるのは、設定から導出されたセキュリティ / 確認のみであり、緩和することはできません。承認フィールドを省略すると、`tools.exec` の値が使用されます。ホストでの Exec は、そのマシン上のローカル承認状態も使用します。実行ホストの承認ファイルにホストローカルの `ask: "always"` がある場合、セッションまたは設定のデフォルトが `ask: "on-miss"` を要求していても、確認は継続されます。
</Note>

## 適用範囲

Exec 承認は実行ホスト上でローカルに適用されます。

- **Gateway ホスト** -> Gateway マシン上の `openclaw` プロセス。
- **Node ホスト** -> Node ランナー（macOS コンパニオンアプリまたはヘッドレス Node ホスト）。

### 信頼モデル

- Gateway で認証された呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリングされた Node は、その信頼されたオペレーターの権限を Node ホストまで拡張します。
- 承認は誤操作による実行リスクを軽減しますが、ユーザー単位の認証境界やファイルシステムの読み取り専用ポリシーでは**ありません**。
- 承認されると、コマンドは選択したホストまたはサンドボックスのファイルシステム権限に従ってファイルを変更できます。
- 承認済みの Node ホスト実行には、正規の実行コンテキスト（cwd、正確な argv、存在する場合は環境変数のバインド、該当する場合は固定された実行可能ファイルのパス）が結び付けられます。
- シェルスクリプトや、インタープリター / ランタイムによるファイルの直接呼び出しでは、OpenClaw は具体的なローカルファイルのオペランドを1つ結び付けることも試みます。そのファイルが承認後、実行前に変更された場合、内容が変化したファイルを実行するのではなく、実行を拒否します。
- ファイルのバインドはベストエフォートであり、すべてのインタープリター / ランタイムのローダーパスを網羅する完全なモデルではありません。具体的なローカルファイルを正確に1つ特定できない場合、OpenClaw は完全に網羅しているかのように扱わず、承認に基づく実行の発行を拒否します。

### macOS での分担

- **Node ホストサービス**は、ローカル IPC を介して `system.run` を**macOS アプリ**に転送します。
- **macOS アプリ**は承認を適用し、UI コンテキストでコマンドを実行します。

## 有効なポリシーの確認

| コマンド                                                         | 表示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーのソース、有効な結果。                               |
| `openclaw exec-policy show`                                      | ローカルマシンで統合されたビュー。                                                     |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたポリシーとローカルホストの承認ファイルを1ステップで同期します。    |

<Note>
セッション単位の `/exec` オーバーライドは含まれません。該当するセッションで `/exec` を実行し、現在のデフォルトを確認してください。[セッションオーバーライド](/ja-JP/tools/exec#session-overrides-exec)を参照してください。
</Note>

完全な CLI リファレンス（フラグ、JSON 出力、許可リストの追加 / 削除）については、[承認 CLI](/ja-JP/cli/approvals)を参照してください。

ローカルスコープが `host=node` を要求している場合、`exec-policy show` はローカル承認ファイルを信頼できる情報源として扱うのではなく、そのスコープが実行時に Node によって管理されることを報告します。

コンパニオンアプリの UI が**利用できない**場合、通常なら確認を表示するすべての要求は、**確認フォールバック**（デフォルト: `deny`）によって解決されます。

<Tip>
ネイティブのチャット承認クライアントは、保留中の承認メッセージにチャネル固有の操作手段を設定できます。Matrix はリアクションショートカット（`✅` 1回許可、`♾️` 常に許可、`❌` 拒否）を設定しつつ、フォールバックとしてメッセージ内に `/approve ...` も残します。
</Tip>

## 設定と保存場所

承認は、実行ホスト上のローカル JSON ファイルに保存されます。`OPENCLAW_STATE_DIR` が設定されている場合、ファイルはその状態ディレクトリに配置されます。設定されていない場合は、OpenClaw のデフォルト状態ディレクトリが使用されます。

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# それ以外の場合
~/.openclaw/exec-approvals.json
```

デフォルトの承認ソケットも同じルートに従います。`$OPENCLAW_STATE_DIR/exec-approvals.sock`、または変数が未設定の場合は `~/.openclaw/exec-approvals.sock` です。

2026.6.6 より前のリリースでは、ファイルは常に `~/.openclaw` に保存されていました。`OPENCLAW_STATE_DIR` が別の場所を指していて、承認ファイルがデフォルトディレクトリに残っている場合は、`openclaw doctor --fix` を直接1回実行して状態ディレクトリへインポートしてください（元のファイルは `.migrated` サフィックス付きでアーカイブされます）。対話型の doctor でもインポートをプレビューして確認できます。自動更新および Gateway 監視の修復実行では、状態ディレクトリをまたぐインポートは一切行われません。一時またはステージング用の状態ディレクトリが、デフォルトインストールの承認を取り込んではなりません。同じ境界が、従来の `plugin-binding-approvals.json` から共有 SQLite 状態へのインポートにも適用されます。

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## ポリシー設定

### `tools.exec.mode`

`tools.exec.mode` は、ホストでの Exec に推奨される正規化済みポリシー設定です。

| 値          | 動作                                                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | ホストでの Exec をブロックします。                                                                                                                                                              |
| `allowlist` | 確認せず、許可リストに登録されたコマンドのみを実行します。                                                                                                                                      |
| `ask`       | 許可リストポリシーを使用し、一致しない場合に確認します。                                                                                                                                        |
| `auto`      | 許可リストポリシーを使用し、決定的に一致するものは直接実行します。承認されていないものは OpenClaw のネイティブ自動レビュアーに送り、その後、人による承認経路へフォールバックします。             |
| `full`      | 承認確認なしでホスト上の Exec を実行します。                                                                                                                                                    |

従来の `tools.exec.security` / `tools.exec.ask` も引き続きサポートされており、そのスコープで `mode` が未設定の場合に適用されます。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - ホストでの Exec 要求をすべてブロックします。
  - `allowlist` - 許可リストに登録されたコマンドのみを許可します。
  - `full` - すべてを許可します（昇格と同等）。

Gateway / Node ホストのデフォルトは `full` です。`sandbox` ホストのデフォルトは代わりに `deny` です。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  ホストでの Exec に設定された確認ポリシーです。`tools.exec.ask` とホスト承認のデフォルトによる、承認確認の基準動作を制御します。デフォルトは `off` です。呼び出し単位の `ask` ツールパラメーター（[Exec ツール](/ja-JP/tools/exec#parameters)を参照）は、この基準を強化することしかできません。また、チャネル由来のモデル呼び出しでは、ホストの有効な確認設定が `off` の場合、このパラメーターは無視されます。

- `off` - 確認を表示しません。
- `on-miss` - 許可リストに一致しない場合のみ確認します。
- `always` - すべてのコマンドで確認します。有効な確認モードが `always` の場合、`allow-always` による永続的な信頼でも確認は**抑制されません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  確認が必要であるにもかかわらず UI に到達できない場合（または確認がタイムアウトした場合）の解決方法です。省略時のデフォルトは `deny` です。

- `deny` - ブロックします。
- `allowlist` - 許可リストに一致する場合のみ許可します。
- `full` - 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、インタープリターのバイナリ自体が許可リストに登録されていても、インラインコード評価形式を承認必須として扱います。1つの安定したファイルオペランドに明確に対応付けられないインタープリターローダーに対する多層防御です。
</ParamField>

厳格モードで検出される例: `python -c`、`node -e`/`--eval`/`-p`、`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（さらに `awk`、`sed`、`make`、`find -exec`、`xargs` のインライン形式）。

厳格モードでは、これらのコマンドにレビュアーまたは明示的な承認が必要です。`tools.exec.mode: "auto"` の場合、コマンドに適用可能な計画があれば、レビュアーは低リスクな実行を1回許可できます。それ以外の場合、OpenClaw は人に確認します。レビュアーへのフォールバックに到達した `Codex app-server` コマンドの承認では、承認要求に適用可能な解決済み実行可能ファイルが公開されないため、人に確認します。インライン評価コマンドでは、`allow-always` によって新しい許可リストエントリが永続化されることはありません。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  表示専用です。有効にすると、OpenClaw はパーサーから導出したコマンド範囲を付加し、Web の承認確認でコマンドトークンを強調表示できるようにします。`security`、`ask`、許可リストの照合、厳格なインライン評価の動作、承認の転送、コマンド実行は**変更しません**。
</ParamField>

グローバルでは `tools.exec.commandHighlighting`、エージェント単位では `agents.list[].tools.exec.commandHighlighting` に設定します。

## YOLO モード（承認なし）

承認確認なしでホスト上の Exec を実行するには、両方のポリシーレイヤーを開放します。つまり、OpenClaw 設定（`tools.exec.*`）で要求される Exec ポリシーと、実行ホストの承認ファイルにあるホストローカル承認ポリシーの**両方**です。

省略された `askFallback` のデフォルトは `deny` です。UI のない承認確認で許可へフォールバックする必要がある場合は、ホストの `askFallback` を明示的に `full` に設定してください。

| レイヤー              | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホストの `askFallback` | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は、Exec を**どこで**実行するかを選択します。サンドボックスが利用できる場合はサンドボックス、それ以外の場合は Gateway です。
- YOLO は、ホスト上の Exec を**どのように**承認するかを選択します。`security=full` と `ask=off` の組み合わせです。
- YOLO は、設定済みのホスト Exec ポリシーの上に、独立したヒューリスティックなコマンド難読化承認ゲートやスクリプト事前検査の拒否レイヤーを追加するものでは**ありません**。
- `auto` によって、サンドボックス化されたセッションから Gateway へのルーティングを自由にオーバーライドできるわけではありません。`auto` からの呼び出し単位の `host=node` 要求は許可されます。`host=gateway` は、アクティブなサンドボックスランタイムがない場合にのみ `auto` から許可されます。`auto` ではない安定したデフォルトを設定するには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。

</Warning>

独自の非対話型権限モードを公開する CLI ベースのプロバイダーも、このポリシーに従えます。OpenClaw の有効な exec ポリシーが YOLO の場合、Claude CLI は `--permission-mode bypassPermissions` を追加します。OpenClaw が管理する Claude ライブセッションでは、Claude ネイティブの権限モードより OpenClaw の有効な exec ポリシーが優先されます。YOLO はライブ起動を `--permission-mode bypassPermissions` に正規化し、制限的な有効 exec ポリシーは、Claude バックエンドの生の引数で別のモードが指定されていても、ライブ起動を `--permission-mode default` に正規化します。

より保守的な設定にする場合は、OpenClaw の exec ポリシーを `allowlist` / `on-miss` または `deny` に戻して厳しくしてください。

### Gateway ホストで永続的に「確認しない」設定にする

<Steps>
  <Step title="要求する設定ポリシーを指定する">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ホストの承認ファイルを一致させる">
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

### ローカル用ショートカット

```bash
openclaw exec-policy preset yolo
```

ローカルの `tools.exec.host/security/ask` と、ローカルの承認ファイルのデフォルト（`askFallback: "full"` を含む）の両方を更新します。意図的にローカル専用となっています。Gateway ホストまたは Node ホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node
<id|name|ip>` を使用してください。

その他の組み込みプリセットには、`cautious`（`host=gateway`、`security=allowlist`、`ask=on-miss`、`askFallback=deny`）と `deny-all`（`host=gateway`、`security=deny`、`ask=off`、`askFallback=deny`）があります。同じ方法で適用します：`openclaw exec-policy preset cautious`。

完全なプリセットではなく個別のフィールドを設定するには、これらのフラグを任意に組み合わせて `openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` を使用します。

### Node ホスト

代わりに、同じ承認ファイルを Node に適用します。

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
**ローカル専用の制限事項：**

- `openclaw exec-policy` は Node の承認を同期しません。
- `openclaw exec-policy set --host node` は拒否されます。
- Node の exec 承認は実行時に Node から取得されるため、Node を対象とする更新では `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションのみを変更します。
- `/elevated full` は、要求されたポリシーとホストの承認ファイルの両方が `security: "full"` および `ask: "off"` に解決される場合に限り、exec 承認を省略する緊急時用ショートカットです。`ask:
"always"` など、より厳格なホストファイルでは引き続き確認が表示されます。

ホストの承認ファイルが設定よりも厳格なままの場合は、より厳格なホストポリシーが引き続き優先されます。

## 許可リスト（エージェントごと）

許可リストは**エージェントごと**です。複数のエージェントが存在する場合は、macOS アプリで編集対象のエージェントを切り替えてください。パターンには glob マッチを使用します。

パターンには、解決済みバイナリパスの glob またはコマンド名だけの glob を指定できます。名前だけのパターンは `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には**一致しません**。特定の 1 か所にあるバイナリだけを信頼するには、パスの glob を使用してください。

従来の `agents.default` エントリは読み込み時に `agents.main` に移行されます。`echo ok && pwd` のようなシェルチェーンでも、最上位の各セグメントが許可リストのルールを満たす必要があります。

例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern による引数の制限

許可リストのエントリを、バイナリと特定の引数形式の両方に一致させる必要がある場合は、`argPattern` を追加します。OpenClaw はすべてのホストで ECMAScript（JavaScript）の正規表現セマンティクスを使用し、実行可能ファイルのトークン（`argv[0]`）を除いた、解析済みのコマンド引数に対して式を評価します。手動作成したエントリでは引数が単一の空白で結合されるため、完全一致が必要な場合はパターンをアンカーしてください。

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

このエントリは `python3 safe.py` を許可しますが、`python3 other.py` は許可リストに一致しません。同じバイナリに対するパスのみのエントリも存在する場合、一致しなかった引数でも、そのパスのみのエントリにフォールバックできます。バイナリを宣言済みの引数に限定することが目的の場合は、パスのみのエントリを省略してください。

承認フローによって保存されるエントリでは、argv の完全一致に内部の区切り形式が使用されます。エンコードされた値を手動で編集するのではなく、UI または承認フローを使用してエントリを再生成することを推奨します。OpenClaw がコマンドセグメントの argv を解析できない場合、`argPattern` を含むエントリは一致しません。

各許可リストエントリは次のフィールドをサポートします。

| フィールド         | 意味                                                   |
| ------------------ | ------------------------------------------------------ |
| `pattern`          | 解決済みバイナリパスの glob またはコマンド名だけの glob |
| `argPattern`       | 任意の ECMAScript argv 正規表現。省略時はパスのみ      |
| `id`               | 安定した不透明 ID。未指定の場合は UUID として生成      |
| `source`           | `allow-always` などのエントリのソース                  |
| `commandText`      | 従来のプレーンテキスト入力。読み込み時に破棄           |
| `lastUsedAt`       | 最後に使用された時刻                                   |
| `lastUsedCommand`  | 最後に一致したコマンド                                 |
| `lastResolvedPath` | 最後に解決されたバイナリパス                           |

## Skills の CLI の自動許可

**Auto-allow skill CLIs**（`autoAllowSkills`）が有効な場合、既知の Skills から参照される実行可能ファイルは、Node（macOS Node またはヘッドレス Node ホスト）上で許可リスト登録済みとして扱われます。これは Gateway RPC 経由の `skills.bins` を使用して Skills のバイナリ一覧を取得します。厳格な手動許可リストを使用する場合は、これを無効にしてください。

<Warning>
- これは手動のパス許可リストエントリとは別の、**暗黙的な利便性のための許可リスト**です。
- Gateway と Node が同じ信頼境界内にある、信頼できる運用環境を対象としています。
- 厳格かつ明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにして、手動のパス許可リストエントリだけを使用してください。

</Warning>

## 安全なバイナリと承認の転送

安全なバイナリ（標準入力専用の高速パス）、インタープリターのバインドに関する詳細、および承認確認を Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、[Exec 承認 - 高度な設定](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

デフォルト、エージェントごとのオーバーライド、および許可リストを編集するには、**Control UI -> Nodes -> Exec approvals** カードを使用します。スコープ（Defaults またはエージェント）を選択し、ポリシーを調整して許可リストのパターンを追加または削除した後、**Save** を選択します。UI にはパターンごとの最終使用メタデータが表示されるため、リストを整理された状態に保てます。

対象セレクターでは、**Gateway**（ローカル承認）または **Node** を選択します。Node は `system.execApprovals.get/set` を通知する必要があります（macOS アプリまたはヘッドレス Node ホスト）。Node がまだ exec 承認を通知していない場合は、そのローカル承認ファイルを直接編集してください。

Windows コンパニオンを含む一部の Node ホストでは、異なる承認ポリシー形式を所有しています。Control UI では、これらのホストネイティブなポリシーは読み取り専用で表示されます。編集するには、コンパニオンアプリまたはネイティブのポリシー形式を指定した `openclaw approvals set --node <id|name|ip>` を使用してください。[承認 CLI](/ja-JP/cli/approvals)も参照してください。

CLI：`openclaw approvals` は Gateway または Node の編集をサポートします。[承認 CLI](/ja-JP/cli/approvals)を参照してください。

## 承認フロー

確認が必要な場合、Gateway はオペレータークライアントに `exec.approval.requested` をブロードキャストします。Control UI と macOS アプリは `exec.approval.resolve` を介してこれを解決し、その後 Gateway が承認済みのリクエストを Node ホストに転送します。

`host=node` の場合、承認リクエストには正規化された `systemRunPlan` ペイロードが含まれます。承認済みの `system.run` リクエストを転送する際、Gateway はそのプランをコマンド、cwd、セッションのコンテキストに関する信頼できる情報源として使用します。

- Node の exec パスは、最初に 1 つの正規プランを準備します。
- 承認レコードは、そのプランとバインド用メタデータを保存します。
- 承認後、最終的に転送される `system.run` 呼び出しは、呼び出し元による後続の編集を信頼せず、保存済みのプランを再利用します。
- 承認リクエストの作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更すると、Gateway は承認の不一致として転送対象の実行を拒否します。

## システムイベントと拒否

Node が完了を報告すると、exec のライフサイクルはエージェントのセッションに `Exec finished` システムメッセージを投稿します。また OpenClaw は、承認が許可されてから `tools.exec.approvalRunningNoticeMs` が経過した時点で、実行中の通知を送信できます（デフォルトは `10000`、`0` で無効化）。拒否された exec 承認は、そのホストコマンドに対する終端結果となり、コマンドは実行されません。

- 発生元のセッションがあるメインエージェントの非同期承認では、OpenClaw は拒否を内部フォローアップとしてそのセッションに投稿します。これにより、エージェントは非同期コマンドの待機を終了でき、結果欠落の修復を回避できます。
- セッションが存在しない場合やセッションを再開できない場合でも、OpenClaw は簡潔な拒否をオペレーターまたは直接チャットの経路に報告できます。
- サブエージェントおよび Cron セッションに対する拒否は、そのセッションには投稿されません。

Gateway ホストの exec 承認も、同じ完了ライフサイクルイベントを送出します。承認が必要な exec は承認 ID を再利用し、保留中のリクエストをその完了または拒否メッセージ（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）に関連付けます。

## 影響

- **`full`** は強力です。可能な場合は許可リストを推奨します。
- **`ask`** は迅速な承認を可能にしつつ、ユーザーによる確認を維持します。
- エージェントごとの許可リストにより、あるエージェントの承認が別のエージェントに漏れることを防ぎます。
- 承認は、**認可済みの送信者**からのホスト exec リクエストにのみ適用されます。認可されていない送信者は `/exec` を実行できません。
- `/exec security=full` は認可済みオペレーター向けのセッションレベルの利便機能であり、設計上、承認を省略します。ホスト exec を完全にブロックするには、承認のセキュリティを `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連項目

<CardGroup cols={2}>
  <Card title="Exec 承認 - 高度な設定" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    安全なバイナリ、インタープリターのバインド、およびチャットへの承認転送。
  </Card>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    シェルコマンド実行ツール。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認も省略する緊急時用経路。
  </Card>
  <Card title="サンドボックス化" href="/ja-JP/gateway/sandboxing" icon="box">
    サンドボックスモードとワークスペースへのアクセス。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security" icon="lock">
    セキュリティモデルと強化。
  </Card>
  <Card title="サンドボックス、ツールポリシー、昇格の比較" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    各制御を使用する場面。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skills に基づく自動許可の動作。
  </Card>
</CardGroup>
