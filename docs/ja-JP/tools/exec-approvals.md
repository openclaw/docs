---
read_when:
    - 実行承認または allowlist を設定する場合
    - macOS アプリで実行承認 UX を実装する場合
    - sandbox-escape プロンプトとその影響をレビューする場合
sidebarTitle: Exec approvals
summary: 'ホスト実行の承認: ポリシー設定項目、allowlist、および YOLO/strict ワークフロー'
title: 実行承認
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:41:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 868cee97882f7298a092bdcb9ec8fd058a5d7cb8745fad2edd712fabfb512e52
    source_path: tools/exec-approvals.md
    workflow: 15
---

実行承認は、sandbox 化されたエージェントが実ホスト（`gateway` または `node`）上でコマンドを実行できるようにするための **companion app / node host のガードレール** です。
安全インターロックとして機能し、コマンドは policy + allowlist +
（任意の）ユーザー承認のすべてが一致した場合にのみ許可されます。実行承認は
tool policy と elevated gating の **上に積み重なって** 適用されます（ただし elevated が `full` に設定されている場合は承認をスキップします）。

<Note>
有効な policy は `tools.exec.*` と approvals defaults の **より厳しい方** です。approvals フィールドが省略されている場合は、`tools.exec` の値が使用されます。ホスト実行はそのマシン上のローカル approvals state も使用します。`~/.openclaw/exec-approvals.json` にあるホストローカルの `ask: "always"` は、session または config の defaults が `ask: "on-miss"` を要求していても、引き続きプロンプトを表示します。
</Note>

## 有効な policy を確認する

| Command                                                          | 表示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求された policy、ホスト policy のソース、および有効な結果。                         |
| `openclaw exec-policy show`                                      | ローカルマシン上でマージされたビュー。                                                 |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求された policy をローカルホストの approvals file と1ステップで同期します。 |

ローカルスコープが `host=node` を要求する場合、`exec-policy show` は、
ローカル approvals file が正しい情報源であるかのように見せるのではなく、
そのスコープを実行時に node 管理として報告します。

companion app UI が **利用できない** 場合、本来プロンプトを表示するはずだった要求はすべて **ask fallback**（デフォルト: `deny`）で解決されます。

<Tip>
ネイティブ chat 承認クライアントは、保留中の承認メッセージに channel 固有の affordance を埋め込めます。たとえば Matrix は reaction shortcut
（`✅` で allow once、`❌` で deny、`♾️` で allow always）を埋め込みつつ、
フォールバックとしてメッセージ内に `/approve ...` コマンドも残します。
</Tip>

## 適用対象

実行承認は、実行ホスト上でローカルに適用されます。

- **Gateway host** → gateway マシン上の `openclaw` プロセス。
- **Node host** → node runner（macOS companion app またはヘッドレス node host）。

### 信頼モデル

- Gateway で認証された caller は、その Gateway の信頼された operator です。
- ペアリングされた node は、その trusted operator capability を node host にまで拡張します。
- 実行承認は偶発的な実行リスクを低減しますが、**ユーザーごとの認証境界ではありません**。
- 承認された node-host 実行は、正規の実行コンテキストに結び付けられます: 正規の cwd、正確な argv、存在する場合の env binding、適用可能な場合の固定された executable path。
- shell script および interpreter/runtime file の直接実行では、OpenClaw は1つの具体的なローカル file operand も結び付けようとします。その bound file が承認後かつ実行前に変更された場合、内容がずれたまま実行する代わりに、その実行は拒否されます。
- file binding は意図的にベストエフォートであり、すべての interpreter/runtime loader path の完全な意味モデル **ではありません**。承認モードでちょうど1つの具体的なローカル file を結び付けられない場合、完全にカバーしているふりをするのではなく、approval-backed run の発行を拒否します。

### macOS の分離

- **node host service** は `system.run` をローカル IPC 経由で **macOS app** に転送します。
- **macOS app** が承認を適用し、UI コンテキストでコマンドを実行します。

## 設定と保存先

承認は、実行ホスト上のローカル JSON file に保存されます。

```text
~/.openclaw/exec-approvals.json
```

schema の例:

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Policy 設定項目

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — すべてのホスト実行要求をブロックします。
  - `allowlist` — allowlist にあるコマンドのみ許可します。
  - `full` — すべて許可します（elevated と同等）。
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — プロンプトを表示しません。
  - `on-miss` — allowlist が一致しない場合のみプロンプトを表示します。
  - `always` — すべてのコマンドでプロンプトを表示します。effective ask mode が `always` の場合、`allow-always` の永続的な信頼は **プロンプトを抑制しません**。
</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要だが UI に到達できない場合の解決方法。

- `deny` — ブロックします。
- `allowlist` — allowlist が一致する場合のみ許可します。
- `full` — 許可します。
  </ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、OpenClaw はインライン code-eval 形式を、
  interpreter binary 自体が allowlist に含まれていても、承認専用として扱います。これは、1つの安定した file operand にきれいに対応しない interpreter loader に対する多層防御です。
</ParamField>

strict mode が検出する例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

strict mode では、これらのコマンドには引き続き明示的な承認が必要であり、
`allow-always` はそれらに対して新しい allowlist エントリを自動的には永続化しません。

## YOLO モード（承認なし）

承認プロンプトなしでホスト実行を行いたい場合は、OpenClaw config の要求された実行 policy
（`tools.exec.*`）と、`~/.openclaw/exec-approvals.json` のホストローカル approvals policy という **両方** の policy レイヤーを開く必要があります。

YOLO は、明示的に厳しくしない限りデフォルトのホスト動作です。

| Layer                 | YOLO 設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は、実行を **どこで** 行うかを選択します: sandbox が利用可能なら sandbox、そうでなければ gateway。
- YOLO は、ホスト実行を **どのように** 承認するかを選択します: `security=full` と `ask=off`。
- YOLO モードでは、OpenClaw は設定済みのホスト実行 policy の上に、別個のヒューリスティックな command-obfuscation 承認ゲートや script-preflight 拒否レイヤーを追加しません。
- `auto` は、sandbox 化された session から gateway routing を自由な上書きにするものではありません。呼び出しごとの `host=node` 要求は `auto` から許可されます。`host=gateway` は、sandbox runtime が有効でない場合にのみ `auto` から許可されます。安定した non-auto のデフォルトが必要なら、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。
  </Warning>

独自の noninteractive permission mode を公開する CLI ベースの provider は、この policy に従えます。
Claude CLI は、OpenClaw の要求された実行 policy が YOLO の場合、
`--permission-mode bypassPermissions` を追加します。このバックエンド動作は、
`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 配下の明示的な Claude 引数
— たとえば `--permission-mode default`、`acceptEdits`、または
`bypassPermissions` — で上書きできます。

より保守的な設定にしたい場合は、どちらかのレイヤーを `allowlist` / `on-miss` または `deny` に戻してください。

### 永続的な gateway-host 「never prompt」設定

<Steps>
  <Step title="要求された config policy を設定する">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="ホスト approvals file を一致させる">
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

このローカルショートカットは、次の両方を更新します。

- ローカルの `tools.exec.host/security/ask`。
- ローカルの `~/.openclaw/exec-approvals.json` defaults。

これは意図的にローカル専用です。gateway-host または node-host の
approvals をリモートで変更するには、`openclaw approvals set --gateway` または
`openclaw approvals set --node <id|name|ip>` を使用してください。

### Node host

node host の場合は、同じ approvals file をその node に適用します。

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

- `openclaw exec-policy` は node approvals を同期しません。
- `openclaw exec-policy set --host node` は拒否されます。
- node 実行承認は実行時に node から取得されるため、node を対象とした更新では `openclaw approvals --node ...` を使用する必要があります。
  </Note>

### Session 専用ショートカット

- `/exec security=full ask=off` は現在の session のみを変更します。
- `/elevated full` はブレークグラス用ショートカットであり、その session では実行承認もスキップします。

ホスト approvals file が config より厳しいままであれば、より厳しいホスト
policy が引き続き優先されます。

## Allowlist（agent ごと）

allowlist は **agent ごと** です。複数の agent が存在する場合は、
macOS app で編集中の agent を切り替えてください。pattern は glob 一致です。

pattern には、解決済み binary path glob または単なる command-name glob を使用できます。
単なる名前は `PATH` 経由で呼び出されたコマンドにのみ一致するため、`rg` は
コマンドが `rg` の場合に `/opt/homebrew/bin/rg` と一致できますが、`./rg` や
`/tmp/rg` とは **一致しません**。特定の binary location のみを信頼したい場合は path glob を使用してください。

レガシーな `agents.default` エントリは、読み込み時に `agents.main` に移行されます。
`echo ok && pwd` のような shell chain では、各トップレベル segment が引き続き allowlist ルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

各 allowlist エントリは以下を追跡します。

| Field              | 意味                                   |
| ------------------ | -------------------------------------- |
| `id`               | UI 識別用の安定した UUID               |
| `lastUsedAt`       | 最終使用時刻                           |
| `lastUsedCommand`  | 一致した最後のコマンド                 |
| `lastResolvedPath` | 最後に解決された binary path           |

## Skill CLI の自動許可

**Auto-allow skill CLIs** が有効な場合、既知の Skills で参照される executable は
node 上で allowlist 済みとして扱われます（macOS node または headless
node host）。これは、skill の bin list を取得するために Gateway RPC 経由で `skills.bins` を使用します。厳格な手動 allowlist を望む場合は、これを無効にしてください。

<Warning>
- これは手動の path allowlist エントリとは別の、**暗黙の利便性 allowlist** です。
- これは Gateway と node が同じ信頼境界にある、信頼された operator 環境向けです。
- 厳格で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動の path allowlist エントリのみを使用してください。
</Warning>

## Safe bins と承認転送

safe bins（stdin-only の高速パス）、interpreter binding の詳細、および
承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、
[Exec approvals — advanced](/ja-JP/tools/exec-approvals-advanced) を参照してください。

## Control UI での編集

**Control UI → Nodes → Exec approvals** カードを使用して、defaults、
agent ごとの override、および allowlist を編集します。スコープ（Defaults または agent）を選び、policy を調整し、allowlist pattern を追加/削除してから **Save** を押してください。UI には pattern ごとの最終使用 metadata が表示されるため、リストを整理した状態に保てます。

ターゲットセレクターは **Gateway**（ローカル承認）または **Node** を選択します。
Node は `system.execApprovals.get/set` を通知している必要があります（macOS app または
headless node host）。node がまだ実行承認を通知していない場合は、そのローカル
`~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は gateway または node の編集をサポートします。詳細は
[Approvals CLI](/ja-JP/cli/approvals) を参照してください。

## 承認フロー

プロンプトが必要な場合、gateway は
`exec.approval.requested` を operator client にブロードキャストします。Control UI と macOS
app はこれを `exec.approval.resolve` で解決し、その後 gateway が
承認済みリクエストを node host に転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan`
payload が含まれます。gateway は、承認済みの `system.run`
リクエストを転送する際に、その plan を権威ある
command/cwd/session context として使用します。

これは、非同期承認の待機時間にとって重要です。

- node 実行パスは、最初に1つの正規 plan を準備します。
- 承認レコードは、その plan とその binding metadata を保存します。
- 承認されると、最終的に転送される `system.run` 呼び出しは、後からの caller 編集を信用するのではなく、保存済み plan を再利用します。
- 承認リクエスト作成後に caller が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、gateway は承認不一致として転送実行を拒否します。

## システムイベント

実行ライフサイクルはシステムメッセージとして表示されます。

- `Exec running`（コマンドが running notice しきい値を超えた場合のみ）。
- `Exec finished`。
- `Exec denied`。

これらは、node がイベントを報告した後に agent の session に投稿されます。
Gateway-host 実行承認も、コマンド完了時（および任意でしきい値を超えて長時間実行した場合）に同じライフサイクルイベントを発行します。
承認ゲート付き実行では、相関しやすいように、これらのメッセージ内で approval id を `runId` として再利用します。

## 承認拒否時の動作

非同期実行承認が拒否された場合、OpenClaw はその session 内で同じコマンドの以前の実行からの出力をエージェントが再利用することを防ぎます。
拒否理由は、「利用可能なコマンド出力はない」という明示的なガイダンス付きで渡されます。これにより、エージェントが新しい出力があると主張したり、以前に成功した実行の古い結果を使って拒否されたコマンドを繰り返したりすることを防ぎます。

## 意味すること

- **`full`** は強力です。可能な限り allowlist を優先してください。
- **`ask`** は、高速な承認を可能にしつつ、ユーザーをループ内に保ちます。
- agent ごとの allowlist により、ある agent の承認が他の agent に漏れることを防ぎます。
- 承認は、**認可された送信者** からのホスト実行要求にのみ適用されます。未認可の送信者は `/exec` を発行できません。
- `/exec security=full` は認可された operator 向けの session レベルの利便機能であり、設計上承認をスキップします。ホスト実行を強制的にブロックしたい場合は、approvals security を `deny` に設定するか、tool policy で `exec` tool を拒否してください。

## 関連項目

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    Safe bins、interpreter binding、および chat への承認転送。
  </Card>
  <Card title="Exec tool" href="/ja-JP/tools/exec" icon="terminal">
    shell コマンド実行 tool。
  </Card>
  <Card title="Elevated mode" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認もスキップするブレークグラス用パス。
  </Card>
  <Card title="Sandboxing" href="/ja-JP/gateway/sandboxing" icon="box">
    sandbox モードと workspace アクセス。
  </Card>
  <Card title="Security" href="/ja-JP/gateway/security" icon="lock">
    セキュリティモデルとハードニング。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    どの制御を使うべきか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skill ベースの自動許可動作。
  </Card>
</CardGroup>
