---
read_when:
    - exec の承認または許可リストの設定
    - macOSアプリでexec承認UXを実装する
    - サンドボックスエスケーププロンプトとその影響をレビューする
sidebarTitle: Exec approvals
summary: 'ホスト exec 承認: ポリシー設定項目、許可リスト、YOLO/strict ワークフロー'
title: 実行承認
x-i18n:
    generated_at: "2026-05-11T20:38:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための **コンパニオンアプリ / ノードホストのガードレール** です。安全インターロックとして、コマンドはポリシー + allowlist + （任意の）ユーザー承認がすべて一致した場合にのみ許可されます。Exec 承認は、ツールポリシーと昇格ゲートの **上に重ねて** 適用されます（ただし昇格が `full` に設定されている場合は承認をスキップします）。

<Note>
有効なポリシーは `tools.exec.*` と承認デフォルトのうち **より厳しい** 方です。承認フィールドが省略された場合は、`tools.exec` の値が使われます。ホスト exec は、そのマシン上のローカル承認状態も使用します。`~/.openclaw/exec-approvals.json` にあるホストローカルの `ask: "always"` は、セッションまたは設定のデフォルトが `ask: "on-miss"` を要求していてもプロンプトを出し続けます。
</Note>

## 有効なポリシーの確認

| コマンド                                                          | 表示内容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーのソース、有効な結果。                       |
| `openclaw exec-policy show`                                      | ローカルマシンでマージされたビュー。                                                             |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたポリシーを、ローカルホストの承認ファイルと 1 ステップで同期します。 |

ローカルスコープが `host=node` を要求すると、`exec-policy show` はローカル承認ファイルが正本であるかのように見せるのではなく、そのスコープを実行時にノード管理として報告します。

コンパニオンアプリの UI が **利用できない** 場合、通常ならプロンプトを出すリクエストは **ask フォールバック**（デフォルト: `deny`）で解決されます。

<Tip>
ネイティブチャット承認クライアントは、保留中の承認メッセージにチャネル固有の便利機能をシードできます。たとえば Matrix は、`/approve ...` コマンドをフォールバックとしてメッセージ内に残したまま、リアクションショートカット（`✅` 1 回だけ許可、`❌` 拒否、`♾️` 常に許可）をシードします。
</Tip>

## 適用される場所

Exec 承認は、実行ホスト上でローカルに強制されます。

- **Gateway ホスト** → Gateway マシン上の `openclaw` プロセス。
- **ノードホスト** → ノードランナー（macOS コンパニオンアプリまたはヘッドレスノードホスト）。

### 信頼モデル

- Gateway 認証済みの呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリング済みノードは、その信頼されたオペレーター能力をノードホストへ拡張します。
- Exec 承認は誤実行のリスクを低減しますが、**ユーザーごとの認証境界やファイルシステムの読み取り専用ポリシーではありません**。
- 承認されると、コマンドは選択されたホストまたはサンドボックスのファイルシステム権限に従ってファイルを変更できます。
- 承認済みのノードホスト実行は、正準の実行コンテキストをバインドします。正準 cwd、正確な argv、存在する場合の env バインド、該当する場合の固定された実行可能ファイルパスです。
- シェルスクリプトと、インタープリターまたはランタイムファイルの直接呼び出しについて、OpenClaw は 1 つの具体的なローカルファイルオペランドのバインドも試みます。そのバインドされたファイルが承認後から実行前までに変更された場合、ずれた内容を実行するのではなく、その実行は拒否されます。
- ファイルバインドは意図的にベストエフォートであり、すべてのインタープリターまたはランタイムローダーパスの完全な意味モデルでは **ありません**。承認モードがバインド対象として 1 つの具体的なローカルファイルを正確に識別できない場合、完全にカバーできるふりをするのではなく、承認に基づく実行の発行を拒否します。

### macOS の分離

- **ノードホストサービス** は `system.run` をローカル IPC 経由で **macOS アプリ** に転送します。
- **macOS アプリ** は承認を強制し、UI コンテキストでコマンドを実行します。

## 設定と保存場所

承認は、実行ホスト上のローカル JSON ファイルに保存されます。

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
  - `allowlist` - allowlist にあるコマンドのみ許可します。
  - `full` - すべてを許可します（昇格と同等）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - プロンプトを出しません。
  - `on-miss` - allowlist に一致しない場合のみプロンプトを出します。
  - `always` - すべてのコマンドでプロンプトを出します。有効な ask モードが `always` の場合、`allow-always` の永続的な信頼はプロンプトを **抑制しません**。

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
  `true` の場合、OpenClaw はインタープリターバイナリ自体が allowlist に含まれていても、インラインコード評価形式を承認専用として扱います。1 つの安定したファイルオペランドにきれいに対応しないインタープリターローダーに対する多層防御です。
</ParamField>

厳格モードで検出される例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

厳格モードでは、これらのコマンドには引き続き明示的な承認が必要であり、`allow-always` によって新しい allowlist エントリーが自動的に永続化されることはありません。

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  exec 承認プロンプトでの表示のみを制御します。有効にすると、OpenClaw はパーサー由来のコマンド範囲を付与し、Web 承認プロンプトでコマンドトークンをハイライトできるようにする場合があります。コマンドテキストのハイライトを有効にするには `true` に設定します。
</ParamField>

この設定は `security`、`ask`、allowlist マッチング、厳格なインライン評価の挙動、承認の転送、コマンド実行を変更 **しません**。`tools.exec.commandHighlighting` の下でグローバルに設定するか、`agents.list[].tools.exec.commandHighlighting` の下でエージェントごとに設定できます。

## YOLO モード（承認なし）

承認プロンプトなしでホスト exec を実行したい場合は、**両方の** ポリシーレイヤーを開く必要があります。OpenClaw 設定の要求 exec ポリシー（`tools.exec.*`）と、`~/.openclaw/exec-approvals.json` 内のホストローカル承認ポリシーです。

明示的に厳しくしない限り、YOLO がデフォルトのホスト動作です。

| レイヤー                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホスト `askFallback`    | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は exec が実行される **場所** を選びます。利用可能な場合はサンドボックス、それ以外は Gateway です。
- YOLO はホスト exec が承認される **方法** を選びます。`security=full` と `ask=off` です。
- YOLO モードでは、OpenClaw は設定済みのホスト exec ポリシーの上に、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前チェック拒否レイヤーを追加 **しません**。
- `auto` は、サンドボックス化されたセッションから Gateway ルーティングを自由に上書きできるようにするものではありません。`auto` からの呼び出しごとの `host=node` リクエストは許可されます。`host=gateway` は、サンドボックスランタイムがアクティブでない場合に限り `auto` から許可されます。安定した非 auto のデフォルトにするには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用します。

</Warning>

独自の非対話型権限モードを公開する CLI ベースのプロバイダーは、このポリシーに従えます。Claude CLI は、OpenClaw の要求 exec ポリシーが YOLO の場合に `--permission-mode bypassPermissions` を追加します。そのバックエンド動作を上書きするには、`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` の下に明示的な Claude 引数を設定します。たとえば `--permission-mode default`、`acceptEdits`、`bypassPermissions` です。

より保守的な設定にしたい場合は、どちらかのレイヤーを `allowlist` / `on-miss` または `deny` に戻して厳しくしてください。

### 永続的な Gateway ホストの「プロンプトなし」設定

<Steps>
  <Step title="要求する設定ポリシーを設定する">
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

これは意図的にローカル専用です。Gateway ホストまたはノードホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を使用します。

### ノードホスト

ノードホストの場合は、代わりに同じ承認ファイルをそのノードに適用します。

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

- `openclaw exec-policy` はノード承認を同期しません。
- `openclaw exec-policy set --host node` は拒否されます。
- ノード exec 承認は実行時にノードから取得されるため、ノードを対象にした更新では `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションのみを変更します。
- `/elevated full` は、そのセッションで exec 承認もスキップする緊急用ショートカットです。

ホスト承認ファイルが設定より厳しいままの場合は、より厳しいホストポリシーが引き続き優先されます。

## Allowlist（エージェントごと）

Allowlist は **エージェントごと** です。複数のエージェントが存在する場合は、macOS アプリで編集対象のエージェントを切り替えてください。パターンは glob マッチです。

パターンには、解決済みバイナリパスの glob または素のコマンド名 glob を指定できます。素の名前は `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には **一致しません**。特定の 1 つのバイナリ位置を信頼したい場合は、パス glob を使用してください。

レガシーの `agents.default` エントリーは、読み込み時に `agents.main` へ移行されます。`echo ok && pwd` のようなシェルチェーンでは、引き続き各トップレベルセグメントが allowlist ルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern による引数の制限

Allowlist エントリーがバイナリと特定の引数形状に一致する必要がある場合は、`argPattern` を追加します。OpenClaw は、実行可能ファイルトークン（`argv[0]`）を除いた解析済みコマンド引数に対して正規表現を評価します。手書きのエントリーでは、引数は単一スペースで結合されるため、完全一致が必要な場合はパターンをアンカーしてください。

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

このエントリーは `python3 safe.py` を許可します。`python3 other.py` は allowlist ミスです。同じバイナリに対するパスのみのエントリーも存在する場合、一致しなかった引数は引き続きそのパスのみのエントリーへフォールバックできます。目的がバイナリを宣言済みの引数に制限することなら、パスのみのエントリーは省略してください。

Entries saved by approval flows は、正確な argv 一致のために内部セパレーター形式を使用できます。エンコードされた値を手動編集するのではなく、UI または承認フローでそれらのエントリを再生成することを推奨します。OpenClaw がコマンドセグメントの argv を解析できない場合、`argPattern` を持つエントリは一致しません。

各 allowlist エントリは次をサポートします。

| フィールド         | 意味                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 解決済みバイナリパスの glob、または素のコマンド名の glob     |
| `argPattern`       | 任意の argv 正規表現。省略されたエントリはパスのみ            |
| `id`               | UI の識別に使用される安定した UUID                           |
| `source`           | `allow-always` などのエントリのソース                         |
| `commandText`      | 承認フローがエントリを作成したときに取得されたコマンドテキスト |
| `lastUsedAt`       | 最後に使用されたタイムスタンプ                                |
| `lastUsedCommand`  | 最後に一致したコマンド                                        |
| `lastResolvedPath` | 最後に解決されたバイナリパス                                  |

## Skills CLI の自動許可

**Skills CLI の自動許可**が有効な場合、既知の Skills から参照される実行可能ファイルは、Node（macOS Node または headless Node ホスト）上で allowlist 登録済みとして扱われます。これは Gateway RPC 経由で `skills.bins` を使用し、Skills の bin リストを取得します。厳密な手動 allowlist を使いたい場合は、これを無効にしてください。

<Warning>
- これは手動のパス allowlist エントリとは別の、**暗黙の利便性 allowlist** です。
- Gateway と Node が同じ信頼境界内にある、信頼済みオペレーター環境を想定しています。
- 厳密で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動のパス allowlist エントリのみを使用してください。

</Warning>

## 安全な bin と承認の転送

安全な bin（stdin のみの高速パス）、インタープリターのバインディング詳細、承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、[Exec 承認 - 高度な設定](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

デフォルト、エージェントごとの上書き、allowlist を編集するには、**Control UI → Nodes → Exec approvals** カードを使用します。スコープ（デフォルトまたはエージェント）を選び、ポリシーを調整し、allowlist パターンを追加または削除してから、**保存**します。UI はパターンごとの最終使用メタデータを表示するため、リストを整理しておけます。

ターゲットセレクターでは、**Gateway**（ローカル承認）または **Node** を選択します。Node は `system.execApprovals.get/set`（macOS アプリまたは headless Node ホスト）を公開している必要があります。Node がまだ exec 承認を公開していない場合は、そのローカルの `~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は Gateway または Node の編集に対応しています。[Approvals CLI](/ja-JP/cli/approvals)を参照してください。

## 承認フロー

プロンプトが必要な場合、gateway は `exec.approval.requested` をオペレータークライアントへブロードキャストします。Control UI と macOS アプリは `exec.approval.resolve` 経由でそれを解決し、その後 gateway が承認済みリクエストを Node ホストへ転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan` ペイロードが含まれます。gateway は、承認済みの `system.run` リクエストを転送するときに、そのプランをコマンド/cwd/セッションコンテキストの権威ある情報として使用します。

これは非同期承認のレイテンシーに関係します。

- Node exec パスは、最初に 1 つの正規プランを準備します。
- 承認レコードは、そのプランとバインディングメタデータを保存します。
- 承認されると、最終的に転送される `system.run` 呼び出しは、後続の呼び出し元による編集を信頼するのではなく、保存済みプランを再利用します。
- 承認リクエストの作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、gateway は転送される実行を承認不一致として拒否します。

## システムイベント

Exec のライフサイクルはシステムメッセージとして表示されます。

- `Exec running`（コマンドが実行中通知のしきい値を超えた場合のみ）。
- `Exec finished`。
- `Exec denied`。

これらは、Node がイベントを報告した後にエージェントのセッションへ投稿されます。Gateway ホストの exec 承認も、コマンド完了時（および任意でしきい値より長く実行中の場合）に同じライフサイクルイベントを送信します。承認で制御された exec は、照合しやすいように、これらのメッセージ内の `runId` として承認 id を再利用します。

## 拒否された承認の動作

非同期 exec 承認が拒否された場合、OpenClaw は、そのセッション内で同じコマンドの以前の実行から得られた出力をエージェントが再利用できないようにします。拒否理由は、コマンド出力が利用できないことを明示するガイダンスとともに渡されるため、エージェントが新しい出力があると主張したり、以前に成功した実行の古い結果を使って拒否されたコマンドを繰り返したりすることを防ぎます。

## 影響

- **`full`** は強力です。可能な場合は allowlist を推奨します。
- **`ask`** は、素早い承認を可能にしつつ、ユーザーが関与し続けられるようにします。
- エージェントごとの allowlist は、あるエージェントの承認が他のエージェントへ漏れることを防ぎます。
- 承認は、**承認済み送信者**からのホスト exec リクエストにのみ適用されます。未承認の送信者は `/exec` を発行できません。
- `/exec security=full` は、承認済みオペレーター向けのセッションレベルの利便機能であり、設計上、承認をスキップします。ホスト exec を強制的にブロックするには、承認セキュリティを `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認 - 高度な設定" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    安全な bin、インタープリターのバインディング、チャットへの承認転送。
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
    Skills を基盤とした自動許可の動作。
  </Card>
</CardGroup>
