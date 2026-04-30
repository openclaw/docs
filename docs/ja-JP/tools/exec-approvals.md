---
read_when:
    - exec の承認または許可リストの設定
    - macOS アプリに exec 承認 UX を実装する
    - サンドボックスエスケーププロンプトとその影響のレビュー
sidebarTitle: Exec approvals
summary: ホスト実行承認：ポリシー設定、許可リスト、YOLO/厳格ワークフロー
title: 実行承認
x-i18n:
    generated_at: "2026-04-30T05:37:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための **コンパニオンアプリ / Node ホストのガードレール**です。安全インターロックとして、ポリシー + 許可リスト + （任意の）ユーザー承認がすべて一致した場合にのみコマンドが許可されます。exec 承認は、ツールポリシーと昇格ゲートの**上に**積み重なります（ただし、昇格が `full` に設定されている場合は承認をスキップします）。

<Note>
有効なポリシーは、`tools.exec.*` と承認デフォルトのうち**より厳しい**方です。承認フィールドが省略された場合は、`tools.exec` の値が使用されます。ホスト exec は、そのマシン上のローカル承認状態も使用します。`~/.openclaw/exec-approvals.json` 内のホストローカルな `ask: "always"` は、セッションまたは設定のデフォルトが `ask: "on-miss"` を要求していても、プロンプトを出し続けます。
</Note>

## 有効なポリシーを確認する

| コマンド                                                          | 表示内容                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたポリシー、ホストポリシーのソース、有効な結果。                       |
| `openclaw exec-policy show`                                      | ローカルマシンでマージされたビュー。                                                             |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたポリシーを、ローカルホストの承認ファイルと 1 ステップで同期します。 |

ローカルスコープが `host=node` を要求する場合、`exec-policy show` は、そのスコープについて、ローカル承認ファイルが信頼できる情報源であるかのように見せかけるのではなく、実行時に Node 管理として報告します。

コンパニオンアプリ UI が**利用できない**場合、通常ならプロンプトが表示されるリクエストは、**ask フォールバック**（デフォルト: `deny`）によって解決されます。

<Tip>
ネイティブのチャット承認クライアントは、保留中の承認メッセージにチャネル固有の操作手段を埋め込めます。たとえば、Matrix はリアクションショートカット（`✅` 1 回だけ許可、`❌` 拒否、`♾️` 常に許可）を埋め込みつつ、フォールバックとして `/approve ...` コマンドをメッセージ内に残します。
</Tip>

## 適用される場所

exec 承認は、実行ホスト上でローカルに強制されます。

- **Gateway ホスト** → Gateway マシン上の `openclaw` プロセス。
- **Node ホスト** → Node ランナー（macOS コンパニオンアプリまたはヘッドレス Node ホスト）。

### 信頼モデル

- Gateway で認証された呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリングされた Node は、その信頼されたオペレーター機能を Node ホストへ拡張します。
- exec 承認は偶発的な実行リスクを減らしますが、ユーザー単位の認証境界では**ありません**。
- 承認済みの Node ホスト実行は、標準 cwd、正確な argv、存在する場合の env バインディング、該当する場合の固定された実行可能ファイルパスという標準実行コンテキストにバインドされます。
- シェルスクリプトと、インタープリター/ランタイムファイルの直接呼び出しについては、OpenClaw は具体的なローカルファイルオペランドを 1 つバインドすることも試みます。承認後、実行前にそのバインドされたファイルが変更された場合、ずれた内容を実行するのではなく、その実行は拒否されます。
- ファイルバインディングは意図的にベストエフォートであり、すべてのインタープリター/ランタイムローダーパスを完全に意味論的にモデル化するものでは**ありません**。承認モードが、バインドすべき具体的なローカルファイルを正確に 1 つ特定できない場合、完全なカバレッジがあるかのように装うのではなく、承認に基づく実行の発行を拒否します。

### macOS の分離

- **Node ホストサービス**は、ローカル IPC 経由で `system.run` を **macOS アプリ**へ転送します。
- **macOS アプリ**は承認を強制し、UI コンテキストでコマンドを実行します。

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

## ポリシーノブ

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — すべてのホスト exec リクエストをブロックします。
  - `allowlist` — 許可リストに登録されたコマンドのみ許可します。
  - `full` — すべてを許可します（昇格と同等）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — プロンプトを表示しません。
  - `on-miss` — 許可リストに一致しない場合のみプロンプトを表示します。
  - `always` — すべてのコマンドでプロンプトを表示します。有効な ask モードが `always` の場合、`allow-always` の永続的な信頼はプロンプトを**抑制しません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要だが UI に到達できない場合の解決方法。

- `deny` — ブロックします。
- `allowlist` — 許可リストに一致する場合のみ許可します。
- `full` — 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、OpenClaw は、インタープリターバイナリ自体が許可リストに登録されていても、インライン code-eval 形式を承認必須として扱います。1 つの安定したファイルオペランドにきれいに対応しないインタープリターローダーに対する多層防御です。
</ParamField>

厳格モードで検出される例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

厳格モードでは、これらのコマンドには引き続き明示的な承認が必要であり、`allow-always` は新しい許可リストエントリを自動的に永続化しません。

## YOLO モード（承認なし）

承認プロンプトなしでホスト exec を実行したい場合は、**両方の**ポリシーレイヤーを開く必要があります。OpenClaw 設定（`tools.exec.*`）で要求される exec ポリシーと、`~/.openclaw/exec-approvals.json` のホストローカル承認ポリシーです。

YOLO は、明示的に厳しくしない限り、デフォルトのホスト動作です。

| レイヤー                 | YOLO 設定               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| ホスト `askFallback`    | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` は、exec が**どこで**実行されるかを選択します。利用可能ならサンドボックス、それ以外は Gateway です。
- YOLO は、ホスト exec が**どのように**承認されるかを選択します。`security=full` と `ask=off` です。
- YOLO モードでは、OpenClaw は、設定済みのホスト exec ポリシーの上に、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前拒否レイヤーを追加しません。
- `auto` は、サンドボックス化されたセッションから Gateway ルーティングを自由に上書きできるようにはしません。呼び出しごとの `host=node` リクエストは `auto` から許可されます。`host=gateway` は、アクティブなサンドボックスランタイムがない場合にのみ `auto` から許可されます。安定した非 auto デフォルトにするには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用します。

</Warning>

独自の非対話型権限モードを公開する CLI バックエンドプロバイダーは、このポリシーに従うことができます。OpenClaw が要求する exec ポリシーが YOLO の場合、Claude CLI は `--permission-mode bypassPermissions` を追加します。このバックエンド動作は、`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` の下で明示的な Claude 引数を指定して上書きできます。たとえば `--permission-mode default`、`acceptEdits`、または `bypassPermissions` です。

より保守的な設定にしたい場合は、どちらかのレイヤーを `allowlist` / `on-miss` または `deny` に戻して厳しくします。

### 永続的な Gateway ホストの「プロンプトを出さない」設定

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

このローカルショートカットは、次の両方を更新します。

- ローカルの `tools.exec.host/security/ask`。
- ローカルの `~/.openclaw/exec-approvals.json` デフォルト。

これは意図的にローカル専用です。Gateway ホストまたは Node ホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を使用します。

### Node ホスト

Node ホストの場合は、代わりに同じ承認ファイルをその Node に適用します。

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
- Node exec 承認は実行時に Node から取得されるため、Node を対象とする更新では `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションのみを変更します。
- `/elevated full` は、そのセッションで exec 承認もスキップする非常用ショートカットです。

ホスト承認ファイルが設定より厳しいままの場合は、より厳しいホストポリシーが引き続き優先されます。

## 許可リスト（エージェントごと）

許可リストは**エージェントごと**です。複数のエージェントが存在する場合は、macOS アプリで編集対象のエージェントを切り替えます。パターンは glob 一致です。

パターンには、解決済みバイナリパス glob または裸のコマンド名 glob を指定できます。裸の名前は `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合は `rg` が `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には**一致しません**。特定のバイナリ位置を信頼したい場合は、パス glob を使用してください。

レガシーの `agents.default` エントリは、読み込み時に `agents.main` へ移行されます。`echo ok && pwd` のようなシェルチェーンでは、引き続きすべてのトップレベルセグメントが許可リストルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

各許可リストエントリは次を追跡します。

| フィールド              | 意味                          |
| ------------------ | -------------------------------- |
| `id`               | UI ID に使用される安定した UUID |
| `lastUsedAt`       | 最後に使用されたタイムスタンプ              |
| `lastUsedCommand`  | 一致した最後のコマンド        |
| `lastResolvedPath` | 最後に解決されたバイナリパス        |

## Skills CLI の自動許可

**Skills CLI の自動許可**が有効な場合、既知の Skills によって参照される実行可能ファイルは、Node（macOS Node またはヘッドレス Node ホスト）上で許可リストに登録されているものとして扱われます。これは Gateway RPC 経由で `skills.bins` を使用して Skills の bin リストを取得します。厳密な手動許可リストが必要な場合は、これを無効にしてください。

<Warning>
- これは、手動のパス許可リストエントリとは別の**暗黙的な利便性のための許可リスト**です。
- Gateway と Node が同じ信頼境界内にある、信頼されたオペレーター環境を想定しています。
- 厳密で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動のパス許可リストエントリのみを使用してください。

</Warning>

## 安全な bin と承認転送

安全な bin（stdin 専用の高速パス）、インタープリターバインディングの詳細、承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、[exec 承認 — 高度](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

デフォルト、エージェントごとの上書き、許可リストを編集するには、**Control UI → Nodes → exec 承認**カードを使用します。スコープ（デフォルトまたはエージェント）を選択し、ポリシーを調整し、許可リストパターンを追加/削除して、**保存**します。UI にはパターンごとの最終使用メタデータが表示されるため、リストを整理された状態に保てます。

ターゲットセレクターは **Gateway**（ローカル承認）または **Node** を選択します。
Node は `system.execApprovals.get/set`（macOS アプリまたは
ヘッドレス Node ホスト）をアドバタイズする必要があります。Node がまだ exec 承認をアドバタイズしていない場合は、
そのローカルの `~/.openclaw/exec-approvals.json` を直接編集します。

CLI: `openclaw approvals` は Gateway または Node の編集をサポートします。詳しくは
[承認 CLI](/ja-JP/cli/approvals) を参照してください。

## 承認フロー

プロンプトが必要な場合、Gateway は
`exec.approval.requested` をオペレータークライアントへブロードキャストします。Control UI と macOS
アプリは `exec.approval.resolve` でそれを解決し、その後 Gateway は
承認済みリクエストを Node ホストへ転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan`
ペイロードが含まれます。Gateway はそのプランを、承認済みの `system.run`
リクエストを転送するときの信頼できる
command/cwd/session コンテキストとして使用します。

これは非同期承認のレイテンシに関係します。

- Node exec パスは、最初に 1 つの正規プランを準備します。
- 承認レコードは、そのプランとバインディングメタデータを保存します。
- 承認されると、最後に転送される `system.run` 呼び出しは、後続の呼び出し元による編集を信頼せず、保存済みプランを再利用します。
- 承認リクエストの作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は転送された実行を承認不一致として拒否します。

## システムイベント

Exec ライフサイクルはシステムメッセージとして表示されます。

- `Exec running`（コマンドが実行中通知のしきい値を超えた場合のみ）。
- `Exec finished`。
- `Exec denied`。

これらは Node がイベントを報告した後、エージェントのセッションへ投稿されます。
Gateway ホストの exec 承認は、コマンド完了時（および任意でしきい値より長く実行中の場合）に同じライフサイクルイベントを発行します。
承認で保護された exec は、照合しやすいように、これらのメッセージ内の `runId` として承認 ID を再利用します。

## 拒否された承認の動作

非同期 exec 承認が拒否されると、OpenClaw は、エージェントが同じセッション内で同じコマンドの以前の実行結果を再利用できないようにします。
拒否理由には、コマンド出力が利用できないことを明示するガイダンスが渡されるため、エージェントが新しい出力があると主張したり、以前成功した実行の古い結果を使って拒否されたコマンドを繰り返したりすることを防ぎます。

## 影響

- **`full`** は強力です。可能な場合は許可リストを優先してください。
- **`ask`** は、高速な承認を可能にしつつ、ユーザーが関与し続けられるようにします。
- エージェントごとの許可リストは、あるエージェントの承認が他へ漏れることを防ぎます。
- 承認は、**認可済み送信者** からのホスト exec リクエストにのみ適用されます。認可されていない送信者は `/exec` を発行できません。
- `/exec security=full` は認可済みオペレーター向けのセッションレベルの利便機能であり、設計上、承認をスキップします。ホスト exec を完全にブロックするには、承認セキュリティを `deny` に設定するか、ツールポリシーで `exec` ツールを拒否します。

## 関連

<CardGroup cols={2}>
  <Card title="高度な exec 承認" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    安全なビン、インタープリターバインディング、チャットへの承認転送。
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
    セキュリティモデルとハードニング。
  </Card>
  <Card title="サンドボックス vs ツールポリシー vs 昇格" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    各制御をどの場面で使うか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skill によって裏付けられた自動許可の動作。
  </Card>
</CardGroup>
