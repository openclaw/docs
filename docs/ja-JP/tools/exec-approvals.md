---
read_when:
    - exec の承認または許可リストの設定
    - macOS アプリでの exec 承認 UX の実装
    - サンドボックス脱出プロンプトとその影響のレビュー
sidebarTitle: Exec approvals
summary: ホストでのコマンド実行の承認：ポリシー設定、許可リスト、YOLO/厳格ワークフロー
title: 実行の承認
x-i18n:
    generated_at: "2026-07-12T14:53:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）上でコマンドを実行できるようにするための、**コンパニオンアプリ／Node ホストのガードレール**です。コマンドは、ポリシー、許可リスト、（任意の）ユーザー承認のすべてが一致した場合にのみ実行されます。
承認は、ツールポリシーと昇格ゲートの**上に重ねて**適用されます（昇格 `full` では承認がスキップされます）。

`deny`、`allowlist`、`ask`、`auto`、`full`、Codex Guardian のマッピング、ACPX ハーネス権限について、モードを中心にまとめた概要は、[権限モード](/ja-JP/tools/permission-modes)を参照してください。

<Note>
有効なポリシーは、`tools.exec.*` と承認のデフォルトのうち、**より厳しい**方です。承認によって、設定から導出されたセキュリティ／確認要件を厳しくすることはできますが、緩和することはできません。承認フィールドを省略した場合は、`tools.exec` の値が使用されます。ホストでの Exec では、そのマシン上のローカル承認状態も使用されます。実行ホストの承認ファイルでホストローカルに `ask: "always"` が設定されている場合、セッションまたは設定のデフォルトで `ask: "on-miss"` が要求されていても、引き続き確認が行われます。
</Note>

## 適用範囲

Exec 承認は、実行ホスト上でローカルに適用されます。

- **Gateway ホスト** -> Gateway マシン上の `openclaw` プロセス。
- **Node ホスト** -> Node ランナー（macOS コンパニオンアプリまたはヘッドレス Node ホスト）。

### 信頼モデル

- Gateway で認証された呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリング済み Node は、その信頼されたオペレーター権限を Node ホストまで拡張します。
- 承認は誤操作による実行リスクを低減しますが、ユーザーごとの認証境界でも、ファイルシステムの読み取り専用ポリシーでも**ありません**。
- 承認後、コマンドは、選択されたホストまたはサンドボックスのファイルシステム権限に従ってファイルを変更できます。
- 承認された Node ホストでの実行は、正規の実行コンテキスト（cwd、正確な argv、存在する場合は環境変数のバインド、該当する場合は固定された実行可能ファイルのパス）に紐付けられます。
- シェルスクリプト、およびインタープリター／ランタイムによるファイルの直接呼び出しでは、OpenClaw はさらに、具体的なローカルファイルのオペランドを 1 つ紐付けようとします。そのファイルが承認後から実行前までに変更された場合、内容が変化したファイルを実行する代わりに、その実行は拒否されます。
- ファイルの紐付けはベストエフォートであり、すべてのインタープリター／ランタイムのローダーパスを完全にモデル化するものではありません。具体的なローカルファイルを正確に 1 つ特定できない場合、OpenClaw は完全に保護できるかのように扱わず、承認に基づく実行の発行を拒否します。

### macOS での分担

- **Node ホストサービス**は、ローカル IPC を介して `system.run` を**macOS アプリ**に転送します。
- **macOS アプリ**は承認を適用し、UI コンテキストでコマンドを実行します。

## 有効なポリシーの確認

| コマンド                                                         | 表示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーのソース、有効な結果。                               |
| `openclaw exec-policy show`                                      | ローカルマシンで統合されたビュー。                                                     |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたポリシーとローカルホストの承認ファイルを 1 ステップで同期します。 |

<Note>
セッションごとの `/exec` オーバーライドは含まれません。該当するセッションで `/exec` を実行し、現在のデフォルトを確認してください。[セッションオーバーライド](/ja-JP/tools/exec#session-overrides-exec)を参照してください。
</Note>

完全な CLI リファレンス（フラグ、JSON 出力、許可リストへの追加／削除）：[承認 CLI](/ja-JP/cli/approvals)。

ローカルスコープが `host=node` を要求する場合、`exec-policy show` はローカル承認ファイルを信頼できる情報源として扱わず、そのスコープが実行時に Node によって管理されることを報告します。

コンパニオンアプリの UI が**利用できない**場合、通常なら確認が行われるすべての要求は、**確認フォールバック**（デフォルト：`deny`）によって解決されます。

<Tip>
ネイティブのチャット承認クライアントは、保留中の承認メッセージにチャンネル固有の操作手段を付与できます。Matrix はリアクションショートカット（`✅` 1 回のみ許可、`♾️` 常に許可、`❌` 拒否）を付与しつつ、フォールバックとしてメッセージ内に `/approve ...` も残します。
</Tip>

## 設定と保存場所

承認は、実行ホスト上のローカル JSON ファイルに保存されます。`OPENCLAW_STATE_DIR` が設定されている場合、ファイルはその状態ディレクトリに従います。設定されていない場合は、OpenClaw のデフォルトの状態ディレクトリを使用します。

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# それ以外の場合
~/.openclaw/exec-approvals.json
```

デフォルトの承認ソケットも同じルートに従います。
`$OPENCLAW_STATE_DIR/exec-approvals.sock`、または変数が設定されていない場合は
`~/.openclaw/exec-approvals.sock` です。

2026.6.6 より前のリリースでは、ファイルは常に `~/.openclaw` に保存されていました。`OPENCLAW_STATE_DIR` が別の場所を指しており、承認ファイルがまだデフォルトディレクトリに存在する場合は、`openclaw doctor --fix` を一度直接実行して、状態ディレクトリにインポートしてください（元のファイルは `.migrated` サフィックス付きでアーカイブされます）。対話形式の doctor でも、インポートをプレビューして確認できます。自動更新および Gateway の監視修復では、状態ディレクトリをまたぐインポートは決して行われません。一時またはステージング用の状態ディレクトリが、デフォルトインストールの承認を取り込んではならないためです。同じ境界は、従来の `plugin-binding-approvals.json` を共有 SQLite 状態へインポートする場合にも適用されます。

スキーマ例：

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

## ポリシー設定項目

### `tools.exec.mode`

`tools.exec.mode` は、ホストでの Exec に推奨される正規化済みポリシー設定項目です。

| 値          | 動作                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | ホストでの Exec をブロックします。                                                                                                                                                      |
| `allowlist` | 確認なしで、許可リストに登録されたコマンドのみを実行します。                                                                                                                            |
| `ask`       | 許可リストポリシーを使用し、一致しない場合に確認します。                                                                                                                                |
| `auto`      | 許可リストポリシーを使用して決定的に一致するものを直接実行し、承認されていないものは OpenClaw のネイティブ自動レビュー担当に送り、その後、人による承認経路にフォールバックします。       |
| `full`      | 承認プロンプトなしでホスト上の Exec を実行します。                                                                                                                                      |

従来の `tools.exec.security` / `tools.exec.ask` も引き続きサポートされ、そのスコープで `mode` が設定されていない場合に適用されます。

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - ホストでのすべての Exec 要求をブロックします。
  - `allowlist` - 許可リストに登録されたコマンドのみを許可します。
  - `full` - すべてを許可します（昇格と同等）。

Gateway／Node ホストのデフォルトは `full` です。`sandbox` ホストのデフォルトは代わりに `deny` です。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  ホストでの Exec に設定された確認ポリシーです。`tools.exec.ask` とホスト承認のデフォルトによる、承認プロンプトの基準動作を制御します。デフォルトは `off` です。呼び出しごとの `ask` ツールパラメーター（[Exec ツール](/ja-JP/tools/exec#parameters)を参照）は、この基準を厳しくすることしかできません。また、チャンネルから発生したモデル呼び出しでは、ホストの有効な確認設定が `off` の場合、このパラメーターは無視されます。

- `off` - 確認しません。
- `on-miss` - 許可リストに一致しない場合にのみ確認します。
- `always` - すべてのコマンドで確認します。有効な確認モードが `always` の場合、`allow-always` による永続的な信頼があっても、プロンプトは**抑制されません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要であるものの、到達可能な UI がない場合（またはプロンプトがタイムアウトした場合）の解決方法です。省略時のデフォルトは `deny` です。

- `deny` - ブロックします。
- `allowlist` - 許可リストに一致する場合にのみ許可します。
- `full` - 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、インタープリターのバイナリ自体が許可リストに登録されていても、インラインコード評価形式を承認必須として扱います。安定した 1 つのファイルオペランドに明確に対応付けられないインタープリターローダーに対する多層防御です。
</ParamField>

厳格モードで検出される例：`python -c`、`node -e`/`--eval`/`-p`、`ruby -e`、`perl -e`/`-E`、`php -r`、`lua -e`、`osascript -e`（さらに `awk`、`sed`、`make`、`find -exec`、`xargs` のインライン形式）。

厳格モードでは、これらのコマンドにはレビュー担当者または明示的な承認が必要です。`tools.exec.mode: "auto"` では、コマンドに適用可能な計画がある場合、レビュー担当者は低リスクの実行を 1 回だけ許可できます。それ以外の場合、OpenClaw は人に確認します。
レビュー担当者へのフォールバックに到達した `Codex app-server` コマンド承認は、その承認要求で適用可能な解決済み実行可能ファイルが公開されないため、人に確認します。
インライン評価コマンドでは、`allow-always` によって新しい許可リスト項目が永続化されることはありません。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  表示専用です。有効にすると、OpenClaw はパーサーから導出されたコマンド範囲を付加し、Web 承認プロンプトでコマンドトークンを強調表示できるようにする場合があります。`security`、`ask`、許可リストの照合、厳格なインライン評価の動作、承認の転送、コマンドの実行は**変更しません**。
</ParamField>

グローバルには `tools.exec.commandHighlighting`、エージェントごとには `agents.list[].tools.exec.commandHighlighting` で設定します。

## YOLO モード（承認なし）

承認プロンプトなしでホスト上の Exec を実行するには、両方のポリシーレイヤーを開放します。つまり、OpenClaw 設定で要求する Exec ポリシー（`tools.exec.*`）**および**実行ホストの承認ファイルにあるホストローカル承認ポリシーです。

省略された `askFallback` のデフォルトは `deny` です。UI がない場合の承認プロンプトを許可にフォールバックさせるには、ホストの `askFallback` を明示的に `full` に設定してください。

| レイヤー              | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホスト `askFallback` | `full`                     |

<Warning>
**重要な違い：**

- `tools.exec.host=auto` は、Exec を**どこで**実行するかを選択します。サンドボックスが利用可能な場合はサンドボックス、それ以外の場合は Gateway です。
- YOLO は、ホスト上の Exec を**どのように**承認するかを選択します。`security=full` と `ask=off` の組み合わせです。
- YOLO は、設定済みのホスト Exec ポリシーに加えて、ヒューリスティックなコマンド難読化の承認ゲートや、スクリプト事前検査による拒否レイヤーを別途追加するものでは**ありません**。
- `auto` は、サンドボックス化されたセッションから Gateway へのルーティングを自由にオーバーライドできるようにするものではありません。`auto` からの呼び出しごとの `host=node` 要求は許可されます。`host=gateway` が `auto` から許可されるのは、アクティブなサンドボックスランタイムがない場合のみです。auto ではない安定したデフォルトを設定するには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。

</Warning>

独自の非対話型権限モードを公開する CLI ベースのプロバイダーは、このポリシーに従うことができます。OpenClaw の実効 exec ポリシーが YOLO の場合、Claude CLI は `--permission-mode bypassPermissions` を追加します。OpenClaw が管理する Claude ライブセッションでは、Claude ネイティブの権限モードよりも OpenClaw の実効 exec ポリシーが優先されます。YOLO はライブ起動を `--permission-mode bypassPermissions` に正規化し、制限的な実効 exec ポリシーは、Claude バックエンドの生の引数で別のモードが指定されていても、ライブ起動を `--permission-mode default` に正規化します。

より保守的なセットアップにする場合は、OpenClaw の exec ポリシーを `allowlist` / `on-miss` または `deny` に戻して厳格化してください。

### Gateway ホストで永続的に「プロンプトを表示しない」セットアップ

<Steps>
  <Step title="要求する設定ポリシーを設定する">
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

### ローカルショートカット

```bash
openclaw exec-policy preset yolo
```

ローカルの `tools.exec.host/security/ask` とローカル承認ファイルのデフォルト（`askFallback: "full"` を含む）の両方を更新します。これは意図的にローカル専用です。Gateway ホストまたは Node ホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node
<id|name|ip>` を使用してください。

その他の組み込みプリセットは、`cautious`（`host=gateway`、`security=allowlist`、`ask=on-miss`、`askFallback=deny`）と `deny-all`（`host=gateway`、`security=deny`、`ask=off`、`askFallback=deny`）です。同じ方法で適用します：`openclaw exec-policy preset cautious`。

完全なプリセットではなく個々のフィールドを設定するには、これらのフラグの任意のサブセットを指定して、`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
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
- `/elevated full` は、要求されたポリシーとホスト承認ファイルの両方が `security: "full"` および `ask: "off"` に解決される場合に限り、exec 承認をスキップする緊急用ショートカットです。`ask:
"always"` など、より厳格なホストファイルでは引き続きプロンプトが表示されます。

ホスト承認ファイルが設定よりも厳格なままの場合は、より厳格なホストポリシーが引き続き優先されます。

## 許可リスト（エージェントごと）

許可リストは**エージェントごと**です。複数のエージェントが存在する場合は、macOS アプリで編集対象のエージェントを切り替えてください。パターンには glob マッチが使用されます。

パターンには、解決済みバイナリパスの glob またはコマンド名のみの glob を指定できます。コマンド名のみの指定は `PATH` 経由で呼び出されたコマンドにだけ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には一致**しません**。特定のバイナリの場所だけを信頼するには、パス glob を使用してください。

従来の `agents.default` エントリは、読み込み時に `agents.main` へ移行されます。`echo ok && pwd` のようなシェルチェーンでは、引き続き最上位の各セグメントが許可リストのルールを満たす必要があります。

例：

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern による引数の制限

許可リストのエントリをバイナリと特定の引数形式に一致させる必要がある場合は、`argPattern` を追加します。OpenClaw はすべてのホストで ECMAScript（JavaScript）の正規表現セマンティクスを使用し、実行可能ファイルのトークン（`argv[0]`）を除いた、解析済みのコマンド引数に対して式を評価します。手動で作成したエントリでは、引数は単一のスペースで結合されるため、完全一致が必要な場合はパターンをアンカーしてください。

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

このエントリは `python3 safe.py` を許可します。`python3 other.py` は許可リストに一致しません。同じバイナリにパスのみのエントリも存在する場合、一致しない引数でも、そのパスのみのエントリにフォールバックできます。バイナリを宣言済みの引数に制限することが目的なら、パスのみのエントリは省略してください。

承認フローによって保存されたエントリでは、argv の完全一致に内部セパレーター形式が使用されます。エンコードされた値を手動で編集するのではなく、UI または承認フローを使用してそれらのエントリを再生成することを推奨します。OpenClaw がコマンドセグメントの argv を解析できない場合、`argPattern` を含むエントリは一致しません。

各許可リストエントリでサポートされる項目：

| フィールド           | 意味                                                   |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | 解決済みバイナリパスの glob またはコマンド名のみの glob |
| `argPattern`       | 任意の ECMAScript argv 正規表現。省略時はパスのみ       |
| `id`               | 安定した不透明 ID。未指定の場合は UUID として生成        |
| `source`           | `allow-always` などのエントリソース                     |
| `commandText`      | 従来のプレーンテキスト入力。読み込み時に破棄             |
| `lastUsedAt`       | 最終使用時刻                                           |
| `lastUsedCommand`  | 最後に一致したコマンド                                  |
| `lastResolvedPath` | 最後に解決されたバイナリパス                            |

## Skills CLI の自動許可

**Skills CLI の自動許可**（`autoAllowSkills`）を有効にすると、既知の Skills から参照される実行可能ファイルは、Node（macOS Node またはヘッドレス Node ホスト）上で許可リストに含まれているものとして扱われます。これは Gateway RPC 経由で `skills.bins` を使用して Skill のバイナリ一覧を取得します。厳格な手動許可リストを使用する場合は無効にしてください。

<Warning>
- これは手動のパス許可リストエントリとは別の、**暗黙的な利便性のための許可リスト**です。
- Gateway と Node が同じ信頼境界内にある、信頼できる運用環境を対象としています。
- 厳格で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにして、手動のパス許可リストエントリのみを使用してください。

</Warning>

## セーフバイナリと承認の転送

セーフバイナリ（stdin 専用の高速パス）、インタープリターのバインドの詳細、および承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、[Exec 承認 - 高度な設定](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

デフォルト、エージェントごとのオーバーライド、および許可リストを編集するには、**Control UI -> Nodes -> Exec approvals** カードを使用します。スコープ（Defaults またはエージェント）を選択し、ポリシーを調整して、許可リストのパターンを追加または削除してから、**Save** を選択します。UI にはパターンごとの最終使用メタデータが表示されるため、リストを整理された状態に保てます。

対象セレクターでは、**Gateway**（ローカル承認）または **Node** を選択します。Node は `system.execApprovals.get/set` を公開している必要があります（macOS アプリまたはヘッドレス Node ホスト）。Node がまだ exec 承認を公開していない場合は、そのローカル承認ファイルを直接編集してください。

Windows コンパニオンなど、一部の Node ホストは異なる承認ポリシー形式を所有します。Control UI では、これらのホストネイティブポリシーは読み取り専用で表示されます。編集するには、コンパニオンアプリ、またはネイティブポリシー形式を指定した `openclaw approvals set --node <id|name|ip>` を使用してください。[承認 CLI](/ja-JP/cli/approvals)を参照してください。

CLI：`openclaw approvals` は Gateway または Node の編集をサポートします。[承認 CLI](/ja-JP/cli/approvals)を参照してください。

## 承認フロー

プロンプトが必要な場合、Gateway は `exec.approval.requested` をオペレータークライアントへブロードキャストします。Control UI と macOS アプリは `exec.approval.resolve` を介してこれを解決し、その後 Gateway は承認済みリクエストを Node ホストへ転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan` ペイロードが含まれます。Gateway は、承認済みの `system.run` リクエストを転送する際、そのプランをコマンド/cwd/セッションコンテキストの正式な情報源として使用します。

- Node の exec パスは、最初に単一の正規プランを準備します。
- 承認レコードには、そのプランとバインディングメタデータが保存されます。
- 承認後、最終的に転送される `system.run` 呼び出しは、その後の呼び出し元による編集を信頼せず、保存済みプランを再利用します。
- 承認リクエストの作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は承認の不一致として転送される実行を拒否します。

## システムイベントと拒否

Node が完了を報告した後、exec ライフサイクルはエージェントのセッションに `Exec finished` システムメッセージを投稿します。OpenClaw は、承認が付与された後、`tools.exec.approvalRunningNoticeMs` が経過すると進行中通知を送信することもできます（デフォルトは `10000`、`0` で無効化）。拒否された exec 承認は、そのホストコマンドに対する終端状態です。コマンドは実行されません。

- 開始元のセッションがあるメインエージェントの非同期承認では、OpenClaw は拒否を内部フォローアップとしてそのセッションへ投稿します。これにより、エージェントは非同期コマンドの待機を停止し、結果欠落の修復を回避できます。
- セッションが存在しない場合やセッションを再開できない場合でも、OpenClaw はオペレーターまたは直接のチャット経路に簡潔な拒否を報告できます。
- サブエージェントおよび Cron セッションの拒否は、そのセッションへ投稿されません。

Gateway ホストの exec 承認でも同じ完了ライフサイクルイベントが送信されます。承認によって制御される exec は、保留中のリクエストとその完了/拒否メッセージ（`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`）を関連付けるために、承認 ID を再利用します。

## 影響

- **`full`** は強力です。可能な場合は許可リストを優先してください。
- **`ask`** は迅速な承認を可能にしながら、ユーザーの関与を維持します。
- エージェントごとの許可リストにより、あるエージェントの承認が他のエージェントへ漏れることを防ぎます。
- 承認は、**承認済みの送信者**からのホスト exec リクエストにのみ適用されます。未承認の送信者は `/exec` を実行できません。
- `/exec security=full` は承認済みオペレーター向けのセッションレベルの利便機能であり、仕様として承認をスキップします。ホスト exec を強制的にブロックするには、承認セキュリティを `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連項目

<CardGroup cols={2}>
  <Card title="Exec 承認 - 高度な設定" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    セーフバイナリ、インタープリターのバインド、チャットへの承認転送。
  </Card>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    シェルコマンド実行ツール。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認もスキップする緊急用パス。
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
    Skill に基づく自動許可の動作。
  </Card>
</CardGroup>
