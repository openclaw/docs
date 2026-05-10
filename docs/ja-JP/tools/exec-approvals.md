---
read_when:
    - 実行承認または許可リストの設定
    - macOS アプリにおける exec 承認 UX の実装
    - サンドボックスエスケーププロンプトとその影響のレビュー
sidebarTitle: Exec approvals
summary: 'ホスト exec 承認: ポリシー調整項目、許可リスト、YOLO/厳格ワークフロー'
title: 実行承認
x-i18n:
    generated_at: "2026-05-10T19:54:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）でコマンドを実行できるようにするための、**コンパニオンアプリ / nodeホストのガードレール**です。安全インターロックとして、コマンドは policy + allowlist +（任意の）ユーザー承認がすべて一致した場合にのみ許可されます。Exec承認は、tool policy と elevated gating の**上に**重ねて適用されます（ただし elevated が `full` に設定されている場合は承認をスキップします）。

<Note>
有効なpolicyは、`tools.exec.*` と承認のデフォルトのうち**より厳しい**方です。承認フィールドが省略されている場合は、`tools.exec` の値が使用されます。ホストexecは、そのマシン上のローカル承認状態も使用します。`~/.openclaw/exec-approvals.json` にあるホストローカルの `ask: "always"` は、セッションまたはconfigのデフォルトが `ask: "on-miss"` を要求していても、プロンプトを出し続けます。
</Note>

## 有効なpolicyの確認

| コマンド                                                          | 表示内容                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 要求されたpolicy、ホストpolicyのソース、有効な結果。                                  |
| `openclaw exec-policy show`                                      | ローカルマシンのマージ済みビュー。                                                     |
| `openclaw exec-policy set` / `preset`                            | ローカルで要求されたpolicyとローカルホストの承認ファイルを1ステップで同期します。     |

ローカルスコープが `host=node` を要求している場合、`exec-policy show` はそのスコープについて、ローカル承認ファイルを真実のソースであるかのように扱うのではなく、ランタイムでnode管理として報告します。

コンパニオンアプリUIが**利用できない**場合、通常ならプロンプトを出すリクエストはすべて **ask fallback**（デフォルト: `deny`）によって解決されます。

<Tip>
ネイティブチャット承認クライアントは、保留中の承認メッセージにチャンネル固有の操作をあらかじめ設定できます。たとえば Matrix はリアクションショートカット（`✅` 1回だけ許可、`❌` 拒否、`♾️` 常に許可）を設定しつつ、フォールバックとしてメッセージ内に `/approve ...` コマンドも残します。
</Tip>

## 適用される場所

Exec承認は、実行ホスト上でローカルに強制されます。

- **Gatewayホスト** → Gatewayマシン上の `openclaw` プロセス。
- **Nodeホスト** → nodeランナー（macOSコンパニオンアプリまたはヘッドレスnodeホスト）。

### 信頼モデル

- Gatewayで認証された呼び出し元は、そのGatewayの信頼済みオペレーターです。
- ペアリングされたnodeは、その信頼済みオペレーター能力をnodeホストへ拡張します。
- Exec承認は偶発的な実行リスクを低減しますが、**ユーザーごとの認証境界**やファイルシステムの読み取り専用policyではありません。
- 承認されると、コマンドは選択されたホストまたはサンドボックスのファイルシステム権限に従ってファイルを変更できます。
- 承認されたnodeホスト実行は、正規のcwd、正確なargv、存在する場合のenvバインディング、該当する場合の固定された実行ファイルパスという正規の実行コンテキストにバインドされます。
- シェルスクリプトおよびインタープリター/ランタイムファイルの直接呼び出しでは、OpenClaw は具体的なローカルファイルオペランド1つにもバインドしようとします。承認後、実行前にそのバインド済みファイルが変更された場合、変更後の内容を実行するのではなく、その実行は拒否されます。
- ファイルバインディングは意図的にベストエフォートであり、**すべてのインタープリター/ランタイムローダーパスの完全な意味モデル**ではありません。承認モードが、バインド対象となる具体的なローカルファイルを正確に1つ識別できない場合、完全にカバーしているかのように扱うのではなく、承認に基づく実行の発行を拒否します。

### macOS分離

- **nodeホストサービス**は、ローカルIPC経由で `system.run` を **macOSアプリ**へ転送します。
- **macOSアプリ**は承認を強制し、UIコンテキストでコマンドを実行します。

## 設定と保存場所

承認は実行ホスト上のローカルJSONファイルに保存されます。

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

## Policyノブ

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - すべてのホストexecリクエストをブロックします。
  - `allowlist` - allowlist済みコマンドのみ許可します。
  - `full` - すべて許可します（elevatedと同等）。

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - プロンプトを出しません。
  - `on-miss` - allowlistに一致しない場合のみプロンプトを出します。
  - `always` - すべてのコマンドでプロンプトを出します。有効なaskモードが `always` の場合、`allow-always` の永続的な信頼はプロンプトを**抑制しません**。

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  プロンプトが必要だがUIに到達できない場合の解決方法。

- `deny` - ブロックします。
- `allowlist` - allowlistに一致する場合のみ許可します。
- `full` - 許可します。

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true` の場合、OpenClaw はインタープリターバイナリ自体がallowlist済みであっても、インラインコードeval形式を承認専用として扱います。安定した1つのファイルオペランドにきれいにマッピングされないインタープリターローダーに対する多層防御です。
</ParamField>

strictモードで検出される例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

strictモードでは、これらのコマンドには引き続き明示的な承認が必要であり、`allow-always` がそれらの新しいallowlistエントリを自動的に永続化することはありません。

## YOLOモード（承認なし）

ホストexecを承認プロンプトなしで実行したい場合は、OpenClaw config内の要求されたexec policy（`tools.exec.*`）**と** `~/.openclaw/exec-approvals.json` 内のホストローカル承認policyの**両方**のpolicyレイヤーを開く必要があります。

YOLOは、明示的に厳格化しない限りデフォルトのホスト動作です。

| レイヤー              | YOLO設定                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node` で `full` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**重要な違い:**

- `tools.exec.host=auto` はexecが**どこで**実行されるかを選びます。サンドボックスが利用可能ならサンドボックス、それ以外はgatewayです。
- YOLOはホストexecが**どのように**承認されるかを選びます。`security=full` に加えて `ask=off` です。
- YOLOモードでは、OpenClaw は設定済みのホストexec policyの上に、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前拒否レイヤーを追加しません。
- `auto` は、サンドボックス化されたセッションからGatewayルーティングを自由に上書きできるようにするものではありません。`auto` からの呼び出しごとの `host=node` リクエストは許可されます。`host=gateway` は、アクティブなサンドボックスランタイムがない場合にのみ `auto` から許可されます。安定した非autoデフォルトを使うには、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用します。

</Warning>

独自の非対話型permissionモードを公開するCLIベースのプロバイダーは、このpolicyに従うことができます。Claude CLI は、OpenClaw の要求されたexec policyがYOLOの場合に `--permission-mode bypassPermissions` を追加します。そのバックエンド動作を上書きするには、`agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` の下で明示的なClaude argsを指定します。たとえば `--permission-mode default`、`acceptEdits`、または `bypassPermissions` です。

より保守的な設定にしたい場合は、いずれかのレイヤーを `allowlist` / `on-miss` または `deny` に戻して厳格化します。

### 永続的なGatewayホストの「プロンプトなし」設定

<Steps>
  <Step title="要求されるconfig policyを設定する">
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

これは意図的にローカル専用です。Gatewayホストまたはnodeホストの承認をリモートで変更するには、`openclaw approvals set --gateway` または `openclaw approvals set --node <id|name|ip>` を使用します。

### Nodeホスト

nodeホストの場合は、代わりにそのnode上で同じ承認ファイルを適用します。

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

- `openclaw exec-policy` はnode承認を同期しません。
- `openclaw exec-policy set --host node` は拒否されます。
- node exec承認はランタイムでnodeから取得されるため、nodeを対象にした更新では `openclaw approvals --node ...` を使用する必要があります。

</Note>

### セッション専用ショートカット

- `/exec security=full ask=off` は現在のセッションのみを変更します。
- `/elevated full` は、そのセッションのexec承認もスキップする非常用ショートカットです。

ホスト承認ファイルがconfigより厳しいままの場合は、引き続きより厳しいホストpolicyが優先されます。

## Allowlist（エージェントごと）

Allowlistは**エージェントごと**です。複数のエージェントが存在する場合は、macOSアプリで編集対象のエージェントを切り替えます。パターンはglob一致です。

パターンには、解決済みバイナリパスglobまたは素のコマンド名globを指定できます。素の名前は `PATH` 経由で呼び出されたコマンドにのみ一致するため、コマンドが `rg` の場合、`rg` は `/opt/homebrew/bin/rg` に一致できますが、`./rg` や `/tmp/rg` には**一致しません**。特定のバイナリ場所を信頼したい場合は、パスglobを使用します。

レガシーの `agents.default` エントリは、ロード時に `agents.main` へ移行されます。`echo ok && pwd` のようなシェルチェーンでは、各トップレベルセグメントがallowlistルールを満たす必要があります。

例:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPatternで引数を制限する

allowlistエントリを、バイナリと特定の引数形状に一致させる必要がある場合は、`argPattern` を追加します。OpenClaw は、実行ファイルトークン（`argv[0]`）を除外した解析済みコマンド引数に対して正規表現を評価します。手書きのエントリでは、引数は単一スペースで結合されるため、完全一致が必要な場合はパターンをアンカーしてください。

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

このエントリは `python3 safe.py` を許可します。`python3 other.py` はallowlistミスです。同じバイナリに対するパスのみのエントリも存在する場合、一致しなかった引数は引き続きそのパスのみのエントリにフォールバックできます。目標が、そのバイナリを宣言済みの引数に制限することである場合は、パスのみのエントリを省略してください。

承認フローで保存されたエントリは、正確なargv一致のために内部区切り形式を使用できます。エンコードされた値を手動編集するのではなく、UIまたは承認フローでそれらのエントリを再生成することを推奨します。OpenClaw がコマンドセグメントのargvを解析できない場合、`argPattern` を持つエントリは一致しません。

各allowlistエントリは次をサポートします:

| フィールド              | 意味                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 解決済みバイナリパスの glob、または単独のコマンド名 glob           |
| `argPattern`       | 任意の argv 正規表現。省略されたエントリはパスのみ            |
| `id`               | UI 識別に使用される安定した UUID                              |
| `source`           | `allow-always` などのエントリソース                          |
| `commandText`      | 承認フローがエントリを作成したときに取得されたコマンドテキスト |
| `lastUsedAt`       | 最終使用タイムスタンプ                                           |
| `lastUsedCommand`  | 最後に一致したコマンド                                     |
| `lastResolvedPath` | 最後に解決されたバイナリパス                                     |

## Skills CLI の自動許可

**Skills CLI の自動許可**が有効な場合、既知の Skills で参照される実行可能ファイルは、ノード（macOS ノードまたはヘッドレスノードホスト）上で許可リスト入りとして扱われます。これは Gateway RPC 経由で `skills.bins` を使用し、Skill の bin リストを取得します。厳密な手動許可リストを使いたい場合は、これを無効にしてください。

<Warning>
- これは手動パス許可リストエントリとは別の、**暗黙的な利便性のための許可リスト**です。
- Gateway とノードが同じ信頼境界内にある、信頼されたオペレーター環境を想定しています。
- 厳密な明示的信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動パス許可リストエントリのみを使用してください。

</Warning>

## 安全な bin と承認転送

安全な bin（stdin のみの高速パス）、インタープリター束縛の詳細、承認プロンプトを Slack/Discord/Telegram に転送する方法（またはネイティブ承認クライアントとして実行する方法）については、[Exec 承認 - 高度](/ja-JP/tools/exec-approvals-advanced)を参照してください。

## Control UI での編集

既定値、エージェントごとのオーバーライド、許可リストを編集するには、**Control UI → Nodes → Exec approvals** カードを使用します。スコープ（既定値またはエージェント）を選択し、ポリシーを調整し、許可リストパターンを追加または削除してから **Save** します。UI はパターンごとの最終使用メタデータを表示するため、リストを整理できます。

ターゲットセレクターは **Gateway**（ローカル承認）または **Node** を選択します。ノードは `system.execApprovals.get/set`（macOS アプリまたはヘッドレスノードホスト）を公開している必要があります。ノードがまだ exec 承認を公開していない場合は、そのローカルの `~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は Gateway またはノードの編集をサポートします。詳細は[承認 CLI](/ja-JP/cli/approvals)を参照してください。

## 承認フロー

プロンプトが必要な場合、Gateway は `exec.approval.requested` をオペレータークライアントにブロードキャストします。Control UI と macOS アプリは `exec.approval.resolve` 経由でそれを解決し、その後 Gateway は承認済みリクエストをノードホストに転送します。

`host=node` の場合、承認リクエストには正規の `systemRunPlan` ペイロードが含まれます。Gateway は、承認済みの `system.run` リクエストを転送するとき、そのプランをコマンド/cwd/セッションコンテキストの信頼できる情報源として使用します。

これは非同期承認のレイテンシに関係します。

- ノード exec パスは、最初に 1 つの正規プランを準備します。
- 承認レコードは、そのプランと束縛メタデータを保存します。
- 承認されると、最終的に転送される `system.run` 呼び出しは、後続の呼び出し元の編集を信頼する代わりに、保存済みプランを再利用します。
- 承認リクエストの作成後に呼び出し元が `command`、`rawCommand`、`cwd`、`agentId`、または `sessionKey` を変更した場合、Gateway は転送される実行を承認の不一致として拒否します。

## システムイベント

exec ライフサイクルはシステムメッセージとして表示されます。

- `Exec running`（コマンドが実行中通知のしきい値を超えた場合のみ）。
- `Exec finished`。
- `Exec denied`。

これらは、ノードがイベントを報告した後にエージェントのセッションへ投稿されます。Gateway ホストの exec 承認は、コマンドが終了したとき（しきい値より長く実行されている場合は任意でその時点にも）同じライフサイクルイベントを発行します。承認ゲート付き exec は、これらのメッセージ内で相関付けを容易にするため、承認 ID を `runId` として再利用します。

## 拒否された承認の動作

非同期 exec 承認が拒否された場合、OpenClaw はエージェントがセッション内で同じコマンドの以前の実行出力を再利用できないようにします。拒否理由には、コマンド出力が利用できないことを明示するガイダンスが渡されます。これにより、エージェントが新しい出力があると主張したり、以前に成功した実行の古い結果を使って拒否されたコマンドを繰り返したりすることを防ぎます。

## 影響

- **`full`** は強力です。可能な場合は許可リストを優先してください。
- **`ask`** は、迅速な承認を可能にしながら、オペレーターをループ内に保ちます。
- エージェントごとの許可リストは、あるエージェントの承認が他のエージェントへ漏れることを防ぎます。
- 承認は、**承認済み送信者**からのホスト exec リクエストにのみ適用されます。未承認の送信者は `/exec` を発行できません。
- `/exec security=full` は承認済みオペレーター向けのセッションレベルの利便機能であり、設計上、承認をスキップします。ホスト exec を強制的にブロックするには、承認セキュリティを `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec 承認 - 高度" href="/ja-JP/tools/exec-approvals-advanced" icon="gear">
    安全な bin、インタープリター束縛、チャットへの承認転送。
  </Card>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    シェルコマンド実行ツール。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated" icon="shield-exclamation">
    承認もスキップする非常用パス。
  </Card>
  <Card title="サンドボックス化" href="/ja-JP/gateway/sandboxing" icon="box">
    サンドボックスモードとワークスペースアクセス。
  </Card>
  <Card title="セキュリティ" href="/ja-JP/gateway/security" icon="lock">
    セキュリティモデルと強化。
  </Card>
  <Card title="サンドボックス vs ツールポリシー vs 昇格" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    それぞれの制御をいつ使うべきか。
  </Card>
  <Card title="Skills" href="/ja-JP/tools/skills" icon="sparkles">
    Skill に基づく自動許可の動作。
  </Card>
</CardGroup>
