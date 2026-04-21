---
read_when:
    - exec 承認または許可リストの設定
    - macOS アプリで exec 承認 UX を実装すること
    - サンドボックス脱出プロンプトとその影響の確認
summary: Exec 承認、許可リスト、およびサンドボックス脱出プロンプト
title: Exec 承認
x-i18n:
    generated_at: "2026-04-21T13:38:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec 承認

Exec 承認は、サンドボックス化されたエージェントが実ホスト（`gateway` または `node`）上でコマンドを実行できるようにするための、**コンパニオンアプリ / ノードホストのガードレール**です。安全インターロックのようなものだと考えてください。コマンドは、ポリシー + 許可リスト + （任意の）ユーザー承認のすべてが許可した場合にのみ実行されます。
Exec 承認は、ツールポリシーおよび昇格ゲーティングへの**追加**です（ただし、elevated が `full` に設定されている場合は承認をスキップします）。
実効ポリシーは、`tools.exec.*` と承認デフォルトの**より厳しい方**です。承認フィールドが省略されている場合は、`tools.exec` の値が使用されます。
ホスト exec では、そのマシン上のローカル承認状態も使用されます。`~/.openclaw/exec-approvals.json` にホストローカルの
`ask: "always"` がある場合、セッションまたは設定のデフォルトが `ask: "on-miss"` を要求していても、引き続き毎回プロンプトが表示されます。
要求されたポリシー、ホストポリシーのソース、および実効結果を確認するには、`openclaw approvals get`、`openclaw approvals get --gateway`、または
`openclaw approvals get --node <id|name|ip>` を使用してください。
ローカルマシンでは、`openclaw exec-policy show` が同じマージ済みビューを表示し、
`openclaw exec-policy set|preset` は、ローカルで要求されたポリシーをローカルホストの承認ファイルと1ステップで同期できます。ローカルスコープが `host=node` を要求する場合、
`openclaw exec-policy show` は、そのスコープをローカル承認ファイルが実効的な信頼できるソースであるかのように見せるのではなく、実行時に node 管理として報告します。

コンパニオンアプリ UI が**利用できない**場合、プロンプトを必要とする要求はすべて
**ask フォールバック**（デフォルト: deny）によって処理されます。

ネイティブチャット承認クライアントは、保留中の承認メッセージ上でチャネル固有の操作も公開できます。たとえば、Matrix では承認プロンプトにリアクションショートカット（`✅` 1回許可、`❌` 拒否、利用可能な場合は `♾️` 常に許可）を事前設定しつつ、フォールバックとしてメッセージ内に `/approve ...` コマンドも残せます。

## 適用箇所

Exec 承認は、実行ホスト上でローカルに適用されます。

- **gateway host** → Gateway マシン上の `openclaw` プロセス
- **node host** → node ランナー（macOS コンパニオンアプリまたはヘッドレス node host）

信頼モデルに関する注記:

- Gateway 認証済みの呼び出し元は、その Gateway の信頼されたオペレーターです。
- ペアリングされたノードは、その信頼されたオペレーター能力を node host に拡張します。
- Exec 承認は偶発的な実行リスクを減らしますが、ユーザーごとの認証境界ではありません。
- 承認済みの node-host 実行では、正規の実行コンテキストがバインドされます: 正規 cwd、厳密な argv、存在する場合は env バインディング、適用可能な場合は固定された実行可能パス。
- シェルスクリプトおよびインタープリター/ランタイムによる直接ファイル実行では、OpenClaw は1つの具体的なローカルファイルオペランドもバインドしようとします。そのバインド対象ファイルが承認後から実行前の間に変更された場合、内容がずれたまま実行するのではなく拒否されます。
- このファイルバインディングは、意図的にベストエフォートであり、すべてのインタープリター/ランタイムローダーパスの完全な意味モデルではありません。承認モードで正確に1つの具体的ローカルファイルをバインドできない場合、完全な保護を装うのではなく、承認付き実行の発行を拒否します。

macOS での分離:

- **node host service** は、`system.run` をローカル IPC 経由で **macOS app** に転送します。
- **macOS app** は、承認を適用し、UI コンテキストでコマンドを実行します。

## 設定と保存先

承認は、実行ホスト上のローカル JSON ファイルに保存されます。

`~/.openclaw/exec-approvals.json`

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 承認なしの「YOLO」モード

承認プロンプトなしでホスト exec を実行したい場合は、**両方**のポリシーレイヤーを開く必要があります。

- OpenClaw 設定内の要求された exec ポリシー（`tools.exec.*`）
- `~/.openclaw/exec-approvals.json` 内のホストローカル承認ポリシー

これは現在、明示的に厳しくしない限りデフォルトのホスト動作です。

- `tools.exec.security`: `gateway`/`node` では `full`
- `tools.exec.ask`: `off`
- ホスト `askFallback`: `full`

重要な違い:

- `tools.exec.host=auto` は、exec の実行先を選びます: 利用可能ならサンドボックス、そうでなければ gateway。
- YOLO は、ホスト exec の承認方法を選びます: `security=full` と `ask=off`。
- YOLO モードでは、OpenClaw は設定済みホスト exec ポリシーに加えて、別個のヒューリスティックなコマンド難読化承認ゲートやスクリプト事前拒否レイヤーを追加しません。
- `auto` は、サンドボックス化セッションからの gateway ルーティングを自由な上書きにしません。呼び出し単位の `host=node` 要求は `auto` から許可され、`host=gateway` はサンドボックスランタイムがアクティブでない場合にのみ `auto` から許可されます。安定した非 auto のデフォルトが必要な場合は、`tools.exec.host` を設定するか、`/exec host=...` を明示的に使用してください。

より保守的な設定にしたい場合は、どちらかのレイヤーを `allowlist` / `on-miss`
または `deny` に戻してください。

gateway host での「決してプロンプトしない」永続設定:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

次に、ホスト承認ファイルも一致するように設定します。

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

現在のマシン上で同じ gateway-host ポリシーを設定するローカルショートカット:

```bash
openclaw exec-policy preset yolo
```

このローカルショートカットは、次の両方を更新します。

- ローカルの `tools.exec.host/security/ask`
- ローカルの `~/.openclaw/exec-approvals.json` デフォルト

これは意図的にローカル専用です。gateway-host または node-host の承認を
リモートで変更する必要がある場合は、引き続き `openclaw approvals set --gateway` または
`openclaw approvals set --node <id|name|ip>` を使用してください。

node host の場合は、同じ承認ファイルをその node に適用します。

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

重要なローカル専用の制限:

- `openclaw exec-policy` は node 承認を同期しません
- `openclaw exec-policy set --host node` は拒否されます
- node exec 承認は実行時に node から取得されるため、node 向け更新では `openclaw approvals --node ...` を使用する必要があります

セッション専用のショートカット:

- `/exec security=full ask=off` は現在のセッションだけを変更します。
- `/elevated full` は、そのセッションの exec 承認もスキップする break-glass ショートカットです。

ホスト承認ファイルが設定より厳しいままなら、より厳しいホストポリシーが引き続き優先されます。

## ポリシーのノブ

### Security (`exec.security`)

- **deny**: すべてのホスト exec 要求をブロックします。
- **allowlist**: 許可リストにあるコマンドのみ許可します。
- **full**: すべてを許可します（elevated と同等）。

### Ask (`exec.ask`)

- **off**: プロンプトを表示しません。
- **on-miss**: 許可リストに一致しない場合のみプロンプトを表示します。
- **always**: すべてのコマンドでプロンプトを表示します。
- `allow-always` の永続信頼は、実効 ask モードが `always` の場合はプロンプトを抑制しません

### Ask fallback (`askFallback`)

プロンプトが必要だが UI に到達できない場合、フォールバックによって次が決まります。

- **deny**: ブロックします。
- **allowlist**: 許可リストに一致する場合のみ許可します。
- **full**: 許可します。

### インラインインタープリター eval のハードニング (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` の場合、OpenClaw は、インタープリターバイナリ自体が許可リストに入っていても、インラインコード eval 形式を承認専用として扱います。

例:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

これは、1つの安定したファイルオペランドにきれいに対応しないインタープリターローダーへの多層防御です。strict モードでは:

- これらのコマンドは引き続き明示的な承認が必要です。
- `allow-always` は、それらに対して新しい許可リストエントリーを自動では永続化しません。

## 許可リスト（エージェントごと）

許可リストは**エージェントごと**です。複数のエージェントが存在する場合、macOS アプリで編集対象のエージェントを切り替えてください。パターンは**大文字小文字を区別しない glob 一致**です。パターンは**バイナリパス**に解決される必要があります（basename のみのエントリーは無視されます）。
レガシーの `agents.default` エントリーは、読み込み時に `agents.main` に移行されます。
`echo ok && pwd` のようなシェルチェーンでは、トップレベルの各セグメントが引き続き許可リストルールを満たす必要があります。

例:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

各許可リストエントリーでは、次を追跡します。

- **id** UI 識別用の安定 UUID（任意）
- **last used** タイムスタンプ
- **last used command**
- **last resolved path**

## Skills CLI の自動許可

**Auto-allow skill CLIs** が有効な場合、既知の Skills で参照されている実行ファイルは node 上で許可リスト入りとして扱われます（macOS node またはヘッドレス node host）。これは、Gateway RPC 経由の `skills.bins` を使って skill bin リストを取得します。厳密な手動許可リストを使いたい場合は、これを無効にしてください。

重要な信頼に関する注意:

- これは手動のパス許可リストエントリーとは別の、**暗黙の利便性許可リスト**です。
- Gateway と node が同じ信頼境界にある、信頼されたオペレーター環境向けです。
- 厳密で明示的な信頼が必要な場合は、`autoAllowSkills: false` のままにし、手動のパス許可リストエントリーのみを使用してください。

## Safe bins（stdin のみ）

`tools.exec.safeBins` は、明示的な許可リストエントリーなしでも、allowlist モードで実行できる **stdin のみ** のバイナリ（たとえば `cut`）の小さなリストを定義します。safe bins は位置ファイル引数とパス風トークンを拒否するため、入力ストリームに対してのみ動作できます。
これは汎用の信頼リストではなく、ストリームフィルターのための狭い高速パスとして扱ってください。
インタープリターやランタイムのバイナリ（たとえば `python3`、`node`、`ruby`、`bash`、`sh`、`zsh`）を `safeBins` に追加しては**いけません**。
コード評価、サブコマンド実行、または設計上ファイル読み取りが可能なコマンドであれば、明示的な許可リストエントリーを優先し、承認プロンプトを有効のままにしてください。
カスタム safe bins では、`tools.exec.safeBinProfiles.<bin>` に明示的なプロファイルを定義する必要があります。
検証は argv の形状のみから決定的に行われます（ホストファイルシステム上の存在確認は行いません）。これにより、allow/deny の違いを通じたファイル存在オラクル動作を防ぎます。
デフォルト safe bins では、ファイル指向オプションが拒否されます（たとえば `sort -o`、`sort --output`、
`sort --files0-from`、`sort --compress-program`、`sort --random-source`、
`sort --temporary-directory`/`-T`、`wc --files0-from`、`jq -f/--from-file`、
`grep -f/--file`）。
safe bins では、stdin のみの動作を壊すオプションに対して、バイナリごとの明示的フラグポリシーも適用されます（たとえば `sort -o/--output/--compress-program` や grep の再帰フラグ）。
long option は safe-bin モードで fail-closed に検証されます。未知のフラグと曖昧な省略形は拒否されます。
safe-bin プロファイルごとに拒否されるフラグ:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins では、stdin のみのセグメントに対して、argv トークンは実行時に**リテラルテキスト**として扱われます（glob 展開なし、`$VARS` 展開なし）。そのため、`*` や `$HOME/...` のようなパターンを使ってファイル読み取りを持ち込むことはできません。
また、safe bins は信頼済みバイナリディレクトリ（システムデフォルトに加え、任意の
`tools.exec.safeBinTrustedDirs`）から解決される必要があります。`PATH` エントリーが自動的に信頼されることはありません。
デフォルトの信頼済み safe-bin ディレクトリは、意図的に最小限です: `/bin`, `/usr/bin`。
safe-bin 実行ファイルがパッケージマネージャー/ユーザーパス（たとえば
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`）にある場合は、それらを明示的に
`tools.exec.safeBinTrustedDirs` に追加してください。
シェルチェーンやリダイレクトは、allowlist モードでは自動許可されません。

シェルチェーン（`&&`, `||`, `;`）は、トップレベルの各セグメントが許可リスト条件を満たす場合に許可されます
（safe bins や skill 自動許可を含む）。allowlist モードでは、リダイレクトは引き続き未対応です。
コマンド置換（`$()` / バッククォート）は、ダブルクォート内を含め、allowlist 解析中に拒否されます。リテラルの `$()` テキストが必要ならシングルクォートを使用してください。
macOS コンパニオンアプリの承認では、シェル制御や展開構文
（`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`）を含む生のシェルテキストは、
シェルバイナリ自体が許可リスト入りしていない限り、allowlist ミスとして扱われます。
シェルラッパー（`bash|sh|zsh ... -c/-lc`）では、リクエストスコープの env 上書きは
小さく明示的な許可リスト（`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`）に縮小されます。
allowlist モードでの allow-always 判定では、既知のディスパッチラッパー
（`env`, `nice`, `nohup`, `stdbuf`, `timeout`）は、ラッパーパスではなく内部実行ファイルパスを永続化します。シェルマルチプレクサー（`busybox`, `toybox`）も、シェルアプレット（`sh`, `ash`,
など）に対してはアンラップされるため、マルチプレクサーバイナリではなく内部実行ファイルが永続化されます。ラッパーまたはマルチプレクサーを安全にアンラップできない場合、許可リストエントリーは自動では永続化されません。
`python3` や `node` のようなインタープリターを許可リストに入れる場合でも、インライン eval に明示的な承認を引き続き要求するため、`tools.exec.strictInlineEval=true` を推奨します。strict モードでは、`allow-always` により無害なインタープリター/スクリプト実行は永続化できますが、インライン eval キャリアは自動では永続化されません。

デフォルトの safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` と `sort` はデフォルトリストに含まれていません。オプトインする場合は、
stdin 以外のワークフローに対して明示的な許可リストエントリーを維持してください。
safe-bin モードの `grep` では、パターンを `-e`/`--regexp` で指定してください。位置指定のパターン形式は拒否されるため、曖昧な位置引数としてファイルオペランドを持ち込むことはできません。

### Safe bins と許可リストの違い

| 項目             | `tools.exec.safeBins`                                  | 許可リスト（`exec-approvals.json`）                         |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| 目的             | 制限された stdin フィルターを自動許可する              | 特定の実行ファイルを明示的に信頼する                        |
| 一致方式         | 実行ファイル名 + safe-bin argv ポリシー                | 解決済み実行ファイルパスの glob パターン                    |
| 引数の範囲       | safe-bin プロファイルとリテラルトークン規則で制限      | パス一致のみ。引数はそれ以外は利用者側の責任                |
| 典型例           | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, カスタム CLI             |
| 最適な用途       | パイプライン内の低リスクなテキスト変換                 | より広い動作や副作用を持つ任意のツール                      |

設定場所:

- `safeBins` は設定から取得されます（`tools.exec.safeBins` またはエージェントごとの `agents.list[].tools.exec.safeBins`）。
- `safeBinTrustedDirs` は設定から取得されます（`tools.exec.safeBinTrustedDirs` またはエージェントごとの `agents.list[].tools.exec.safeBinTrustedDirs`）。
- `safeBinProfiles` は設定から取得されます（`tools.exec.safeBinProfiles` またはエージェントごとの `agents.list[].tools.exec.safeBinProfiles`）。エージェントごとのプロファイルキーはグローバルキーを上書きします。
- 許可リストエントリーは、ホストローカルの `~/.openclaw/exec-approvals.json` の `agents.<id>.allowlist` に保存されます（または Control UI / `openclaw approvals allowlist ...` 経由）。
- `openclaw security audit` は、インタープリター/ランタイムのバイナリが明示的プロファイルなしで `safeBins` にある場合、`tools.exec.safe_bins_interpreter_unprofiled` で警告します。
- `openclaw doctor --fix` は、不足しているカスタム `safeBinProfiles.<bin>` エントリーを `{}` として足場生成できます（その後に確認して厳しくしてください）。インタープリター/ランタイムのバイナリは自動では足場生成されません。

カスタムプロファイルの例:
__OC_I18N_900005__
`jq` を明示的に `safeBins` にオプトインした場合でも、OpenClaw は safe-bin
モードで `env` ビルトインを引き続き拒否するため、`jq -n env` でホストプロセス環境をダンプすることは、明示的な許可リストパスまたは承認プロンプトなしにはできません。

## Control UI での編集

デフォルト、エージェントごとの
上書き、および許可リストを編集するには、**Control UI → Nodes → Exec approvals** カードを使用します。スコープ（Defaults またはエージェント）を選び、ポリシーを調整し、
許可リストパターンを追加/削除してから、**Save** します。UI にはパターンごとの **last used** メタデータが表示されるため、一覧を整理しやすくなっています。

対象セレクターでは、**Gateway**（ローカル承認）または **Node** を選択します。Node は
`system.execApprovals.get/set`（macOS app または headless node host）を公開している必要があります。
node がまだ exec 承認を公開していない場合は、そのローカルの
`~/.openclaw/exec-approvals.json` を直接編集してください。

CLI: `openclaw approvals` は gateway または node の編集をサポートします（[Approvals CLI](/cli/approvals) を参照）。

## 承認フロー

プロンプトが必要な場合、gateway は `exec.approval.requested` をオペレータークライアントにブロードキャストします。
Control UI と macOS app は `exec.approval.resolve` でこれを解決し、その後 gateway は
承認済み要求を node host に転送します。

`host=node` では、承認要求に正規の `systemRunPlan` ペイロードが含まれます。gateway は、
承認済み `system.run` 要求を転送する際に、その plan を正規のコマンド/cwd/セッションコンテキストとして使用します。

これは非同期承認の待ち時間で重要になります:

- node exec パスは、前もって1つの正規 plan を準備します
- 承認レコードには、その plan とバインディングメタデータが保存されます
- 承認されると、最終的に転送される `system.run` 呼び出しは、
  後からの呼び出し元編集を信頼せず、保存済みの plan を再利用します
- 承認要求作成後に呼び出し元が `command`, `rawCommand`, `cwd`, `agentId`, または
  `sessionKey` を変更した場合、gateway は
  承認不一致として転送実行を拒否します

## インタープリター/ランタイムコマンド

承認付きのインタープリター/ランタイム実行は、意図的に保守的です。

- 厳密な argv/cwd/env コンテキストは常にバインドされます。
- 直接シェルスクリプト形式と直接ランタイムファイル形式は、ベストエフォートで1つの具体的ローカル
  ファイルスナップショットにバインドされます。
- なお1つの直接ローカルファイルに解決される一般的なパッケージマネージャーのラッパー形式（たとえば
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`）は、バインド前にアンラップされます。
- OpenClaw がインタープリター/ランタイムコマンドに対して正確に1つの具体的ローカルファイルを特定できない場合
  （たとえばパッケージスクリプト、eval 形式、ランタイム固有のローダーチェーン、または曖昧な複数ファイル形式）、
  意味上の保護範囲を持っているかのように主張する代わりに、承認付き実行は拒否されます。
- そのようなワークフローでは、サンドボックス化、別のホスト境界、またはオペレーターがより広いランタイム意味論を受け入れる
  明示的な trusted allowlist/full ワークフローを優先してください。

承認が必要な場合、exec ツールは承認 ID を返して直ちに終了します。その ID を使って、
後続のシステムイベント（`Exec finished` / `Exec denied`）を関連付けてください。タイムアウトまでに
決定が届かない場合、要求は承認タイムアウトとして扱われ、拒否理由として表示されます。

### フォローアップ配信動作

承認済みの非同期 exec が終了すると、OpenClaw は同じセッションにフォローアップの `agent` ターンを送信します。

- 有効な外部配信先が存在する場合（配信可能なチャネルに加え、対象の `to`）、フォローアップ配信はそのチャネルを使用します。
- Web チャット専用または外部ターゲットのない内部セッションフローでは、フォローアップ配信はセッション内のみのままです（`deliver: false`）。
- 呼び出し元が解決可能な外部チャネルなしで厳密な外部配信を明示的に要求した場合、要求は `INVALID_REQUEST` で失敗します。
- `bestEffortDeliver` が有効で、外部チャネルを解決できない場合、配信は失敗ではなくセッション内のみにダウングレードされます。

確認ダイアログには次が含まれます。

- command + args
- cwd
- agent id
- 解決済み実行ファイルパス
- host + ポリシーメタデータ

操作:

- **1回許可** → 今すぐ実行
- **常に許可** → 許可リストに追加して実行
- **拒否** → ブロック

## 承認のチャットチャネルへの転送

exec 承認プロンプトは任意のチャットチャネル（Plugin チャネルを含む）に転送でき、
`/approve` で承認できます。これは通常の送信配信パイプラインを使用します。

設定:
__OC_I18N_900006__
チャットで返信:
__OC_I18N_900007__
`/approve` コマンドは、exec 承認と Plugin 承認の両方を処理します。ID が保留中の exec 承認に一致しない場合、自動的に Plugin 承認も確認します。

### Plugin 承認の転送

Plugin 承認の転送は、exec 承認と同じ配信パイプラインを使用しますが、
`approvals.plugin` 配下に独立した専用設定があります。一方を有効または無効にしても、もう一方には影響しません。
__OC_I18N_900008__
設定の形は `approvals.exec` と同一です: `enabled`, `mode`, `agentFilter`,
`sessionFilter`, `targets` は同じように動作します。

共有インタラクティブ返信をサポートするチャネルでは、exec 承認と
Plugin 承認の両方に同じ承認ボタンが表示されます。共有インタラクティブ UI を持たないチャネルでは、`/approve`
手順付きのプレーンテキストにフォールバックします。

### 任意のチャネルでの同一チャット承認

exec または Plugin 承認要求が配信可能なチャット画面から発生した場合、同じチャットで
デフォルトで `/approve` によって承認できるようになりました。これは、既存の Web UI と terminal UI フローに加えて、Slack、Matrix、Microsoft Teams などのチャネルにも適用されます。

この共有テキストコマンド経路は、その会話の通常のチャネル認証モデルを使用します。発生元チャットがすでにコマンド送信と返信受信を行えるなら、承認要求を保留状態に維持するためだけの
別のネイティブ配信アダプターは不要になりました。

Discord と Telegram も同一チャット `/approve` をサポートしますが、ネイティブ承認配信が無効でも、
これらのチャネルは引き続き解決済み approver リストを認可に使用します。

Telegram や、Gateway を直接呼び出すその他のネイティブ承認クライアントでは、
このフォールバックは意図的に「承認が見つからない」失敗に限定されています。実際の
exec 承認拒否/エラーは、黙って Plugin 承認として再試行されることはありません。

### ネイティブ承認配信

一部のチャネルは、ネイティブ承認クライアントとしても動作できます。ネイティブクライアントは、共有の同一チャット `/approve`
フローに加えて、approver DM、発生元チャットへのファンアウト、チャネル固有の対話型承認 UX を追加します。

ネイティブ承認カード/ボタンが利用可能な場合、そのネイティブ UI がエージェント向けの主要な経路です。ツール結果でチャット承認が利用できない、または手動承認だけが残された経路であると示されていない限り、エージェントは重複した平文チャットの
`/approve` コマンドも返すべきではありません。

一般モデル:

- ホスト exec ポリシーが、exec 承認が必要かどうかを引き続き決定します
- `approvals.exec` は、承認プロンプトを他のチャット宛先へ転送するかどうかを制御します
- `channels.<channel>.execApprovals` は、そのチャネルがネイティブ承認クライアントとして動作するかどうかを制御します

ネイティブ承認クライアントは、次のすべてが真の場合に DM 優先配信を自動有効化します。

- そのチャネルがネイティブ承認配信をサポートしている
- approver が、明示的な `execApprovals.approvers` またはその
  チャネルで文書化されたフォールバックソースから解決できる
- `channels.<channel>.execApprovals.enabled` が未設定、または `"auto"`

ネイティブ承認クライアントを明示的に無効にするには `enabled: false` を設定します。approver が解決できるときに
強制的に有効にするには `enabled: true` を設定します。公開の発生元チャット配信は、引き続き
`channels.<channel>.execApprovals.target` による明示設定です。

FAQ: [チャット承認に exec 承認設定が2つあるのはなぜですか？](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

これらのネイティブ承認クライアントは、共有の同一チャット `/approve` フローと共有承認ボタンに加えて、DM ルーティングと任意のチャネルファンアウトを追加します。

共有動作:

- Slack、Matrix、Microsoft Teams、および同様の配信可能チャットでは、同一チャット `/approve` に通常のチャネル認証モデルを使用します
- ネイティブ承認クライアントが自動有効化されると、デフォルトのネイティブ配信先は approver DM になります
- Discord と Telegram では、解決済み approver のみが承認または拒否できます
- Discord の approver は、明示的（`execApprovals.approvers`）または `commands.ownerAllowFrom` から推論できます
- Telegram の approver は、明示的（`execApprovals.approvers`）または既存の owner 設定（`allowFrom`、加えてサポートされる場合はダイレクトメッセージの `defaultTo`）から推論できます
- Slack の approver は、明示的（`execApprovals.approvers`）または `commands.ownerAllowFrom` から推論できます
- Slack のネイティブボタンは承認 ID 種別を保持するため、`plugin:` ID は
  2つ目の Slack ローカルフォールバックレイヤーなしで Plugin 承認を解決できます
- Matrix のネイティブ DM/チャネルルーティングとリアクションショートカットは、exec 承認と Plugin 承認の両方を処理します。
  Plugin 認可は引き続き `channels.matrix.dm.allowFrom` から提供されます
- 要求元が approver である必要はありません
- 発生元チャットがすでにコマンドと返信をサポートしている場合、そのチャットから直接 `/approve` で承認できます
- ネイティブ Discord 承認ボタンは承認 ID 種別でルーティングします: `plugin:` ID は
  直接 Plugin 承認へ進み、それ以外はすべて exec 承認へ進みます
- ネイティブ Telegram 承認ボタンは、`/approve` と同じ制限付き exec-to-plugin フォールバックに従います
- ネイティブ `target` が発生元チャット配信を有効にすると、承認プロンプトにはコマンドテキストが含まれます
- 保留中の exec 承認はデフォルトで 30 分後に期限切れになります
- オペレーター UI または設定済み承認クライアントが要求を受け付けられない場合、プロンプトは `askFallback` にフォールバックします

Telegram はデフォルトで approver DM（`target: "dm"`）を使用します。承認プロンプトを発生元の Telegram チャット/トピックにも表示したい場合は、`channel` または `both` に切り替えられます。Telegram のフォーラムトピックでは、OpenClaw は承認プロンプトと承認後フォローアップの両方でトピックを維持します。

参照:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC フロー
__OC_I18N_900009__
セキュリティに関する注記:

- Unix ソケットモード `0600`、トークンは `exec-approvals.json` に保存されます。
- 同一 UID ピアチェック。
- チャレンジ/レスポンス（nonce + HMAC token + request hash）+ 短い TTL。

## システムイベント

Exec ライフサイクルは、システムメッセージとして表面化されます。

- `Exec running`（コマンドが実行中通知しきい値を超えた場合のみ）
- `Exec finished`
- `Exec denied`

これらは、node がイベントを報告した後にエージェントのセッションへ投稿されます。
gateway-host exec 承認でも、コマンド完了時（および任意で、しきい値より長く実行された場合の実行中時）に同じライフサイクルイベントを発行します。
承認ゲート付き exec では、これらのメッセージで相関しやすいよう、承認 ID を `runId` として再利用します。

## 拒否された承認の動作

非同期 exec 承認が拒否されると、OpenClaw はエージェントがセッション内の同じコマンドの以前の実行結果を再利用することを防ぎます。拒否理由は、利用可能なコマンド出力がないことを明示するガイダンス付きで渡されるため、エージェントが新しい出力があると主張したり、以前の成功実行の古い結果を使って拒否されたコマンドを繰り返したりするのを防ぎます。

## 含意

- **full** は強力です。可能なら許可リストを優先してください。
- **ask** を使うと、迅速な承認を可能にしつつ、引き続き状況を把握できます。
- エージェントごとの許可リストにより、あるエージェントの承認が他に漏れません。
- 承認は、**認可済み送信元**からのホスト exec 要求にのみ適用されます。未認可送信元は `/exec` を発行できません。
- `/exec security=full` は、認可済みオペレーター向けのセッションレベルの利便機能であり、設計上承認をスキップします。
  ホスト exec を強制的にブロックするには、承認 security を `deny` に設定するか、ツールポリシーで `exec` ツールを拒否してください。

関連:

- [Exec tool](/ja-JP/tools/exec)
- [Elevated mode](/ja-JP/tools/elevated)
- [Skills](/ja-JP/tools/skills)

## 関連

- [Exec](/ja-JP/tools/exec) — シェルコマンド実行ツール
- [Sandboxing](/ja-JP/gateway/sandboxing) — サンドボックスモードとワークスペースアクセス
- [Security](/ja-JP/gateway/security) — セキュリティモデルとハードニング
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — それぞれを使い分ける場面
