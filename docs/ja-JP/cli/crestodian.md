---
read_when:
    - セットアップ後にコマンドなしで openclaw を実行し、Crestodian について理解したい
    - OpenClaw を検査または修復するための、設定なしでも安全な方法が必要です。
    - メッセージチャネルのレスキューモードを設計または有効化している
summary: Crestodian の CLI リファレンスとセキュリティモデル。設定不要で安全なセットアップと修復のヘルパー
title: Crestodian
x-i18n:
    generated_at: "2026-07-05T11:11:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abe91886e3faeebc20203639cd811a515509e252e29b11fb7d710e9924cb556f
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian は OpenClaw のローカルセットアップ、修復、構成ヘルパーです。通常のエージェント経路が壊れている場合でも到達可能なままです。`openclaw.json` が存在しないか無効な場合、Gateway が停止している場合、Plugin コマンド登録が利用できない場合、またはまだエージェントが構成されていない場合でも実行できます。

## 起動するタイミング

サブコマンドなしで `openclaw` を実行すると、構成状態に基づいてルーティングされます。

- 構成が存在しない、または作成済み設定がない状態で存在する場合（空、または `$schema`/`meta` キーのみ）: クラシックオンボーディングを開始します。
- 構成は存在するが検証に失敗する場合: Crestodian を開始します。
- 構成が存在し有効な場合: 通常のエージェント TUI を開きます（到達可能な構成済み Gateway に対して、または到達可能なものがない場合はローカルで）。Crestodian に到達するには、TUI 内で `/crestodian` を使用するか、`openclaw crestodian` を直接実行します。

`openclaw crestodian` を実行すると、構成状態に関係なく常に Crestodian が明示的に開始されます。`openclaw --help` と `openclaw --version` は通常の高速経路を維持します。

非対話型の裸の `openclaw`（TTY なし）は、ルートヘルプを出力する代わりに短いメッセージで終了します。新規インストールでは非対話型オンボーディングを指し、構成が無効な場合は `openclaw crestodian --message "status"` を指し、構成が有効な場合は `openclaw agent --local ...` を指します。

`openclaw onboard --modern` は、モダンオンボーディングのプレビューとして Crestodian を開始します。通常の `openclaw onboard` はクラシックオンボーディングを維持します。

## Crestodian が表示する内容

対話型 Crestodian は、`openclaw tui` と同じ TUI シェルを Crestodian チャットバックエンド付きで開きます。起動時のあいさつには以下が含まれます。

- 構成の有効性とデフォルトエージェント
- Crestodian が使用しているモデルまたは決定論的プランナー経路
- 最初の起動プローブから見た Gateway 到達性
- 次に推奨されるデバッグアクション

起動するためだけにシークレットをダンプしたり、Plugin CLI コマンドを読み込んだりはしません。

詳細なインベントリには `status` を使用します。構成パス、docs/source パス、ローカル CLI プローブ、API キーの有無、エージェント、モデル、Gateway の詳細が含まれます。

Crestodian は通常のエージェントと同じ参照検出を使用します。Git チェックアウトではローカルの `docs/` とソースツリーを指します。npm インストールではバンドルされたドキュメントを使用し、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) にリンクします。ドキュメントだけでは不十分な場合はソースを確認するよう案内します。

## 例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Crestodian TUI 内では次のようにします。

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 操作と承認

Crestodian は、構成を場当たり的に編集する代わりに型付き操作を使用します。

読み取り専用で即時実行: 概要の表示、エージェント一覧、インストール済み Plugin 一覧、ClawHub Plugin の検索、モデル/バックエンド状態の表示、status/health チェックの実行、Gateway 到達性の確認、対話型修正なしの doctor 実行、構成の検証、監査ログパスの表示。

永続的で、会話による承認（または直接コマンドでは `--yes`）が必要: 構成の書き込み、`config set`、`config set-ref`、セットアップ/オンボーディングのブートストラップ、デフォルトモデルの変更、Gateway の起動/停止/再起動、エージェントの作成、Plugin のインストールまたはアンインストール、構成または状態を書き換える doctor 修復の実行。

適用された書き込みは `~/.openclaw/audit/crestodian.jsonl` に記録されます。検出は監査されません。適用された操作と書き込みのみが対象です。

チャネルセットアップは、ホストがマスク入力をサポートしている場合、ホストされた会話として実行できます。ローカルの Crestodian TUI は機密性の高いウィザード回答を受け付けません。代わりに、認証情報をマスクする対話型プロンプトを持つ `openclaw channels add --channel <channel>` に案内します。

## セットアップブートストラップ

`setup` はチャットファーストのオンボーディングブートストラップです。型付き構成操作を通してのみ書き込み、最初に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが構成されていない場合、setup は次の順序で最初に使用可能なバックエンドを選び、何を選んだかを伝えます。

1. 既存の明示的なモデル（すでに構成されている場合）。
2. `OPENAI_API_KEY` -> `openai/gpt-5.5`
3. `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
4. Claude Code CLI -> `claude-cli/claude-opus-4-8`
5. Codex -> Codex app-server ハーネス経由の `openai/gpt-5.5`

利用可能なものがない場合でも、setup はデフォルトワークスペースを書き込み、モデルは未設定のままにします。Codex/Claude Code をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、setup を再度実行します。

## モデル支援プランナー

Interactive Crestodian は AI ファーストです。正確に入力されたコマンドは即座に決定論的に実行されます。それ以外のすべてのメッセージは、通常の OpenClaw エージェントと同じ埋め込みエージェントループを通り、型付き操作をラップする単一の ring-zero `crestodian` ツールに制限されます。読み取りアクションは自由に実行され、変更にはその正確な操作に対する会話上の yes が必要で、適用されたすべての書き込みは監査され、再検証されます。エージェントセッションは永続化されるため、custodian は実際の複数ターンの記憶を持ちます。まず設定済みの OpenClaw モデルを使用します。使用可能なモデルがない場合は、マシン上にすでに存在するローカルランタイムにフォールバックします。

- Claude Code CLI: `claude-cli/claude-opus-4-8`（エージェントループ。ring-zero ツールは MCP 経由で提供されます。下記の信頼モデルを参照）
- Codex app-server harness: `openai/gpt-5.5`（強制された単一ツール許可リスト付きのエージェントループ）

エージェントループが利用できない場合、Crestodian は境界付きの単一ターンプランナーに縮退し、モデルがまったくない場合は決定論的な型付きコマンドに縮退します。プランナーは config を直接変更できません。リクエストを Crestodian の型付きコマンドのいずれかに変換する必要があり、通常の承認/監査ルールが適用されます。Crestodian は何かを実行する前に、使用したモデルと解釈されたコマンドを表示します。フォールバックプランナーのターンは一時的で、ランタイムが対応している場合はツール無効化され、一時ワークスペース/セッションを使用します。

メッセージチャネルのレスキューモードでは、モデル支援プランナーを使用しません。リモートレスキューは決定論的なままなので、壊れた、または侵害された通常のエージェント経路を config エディタとして使用することはできません。

### CLI harness の信頼モデル

埋め込みランタイムと Codex app-server harness は ring-zero の
制限を直接強制します。実行には `crestodian` ツールのみを含む
ツール許可リストが渡されます。CLI harness（Claude Code、Gemini CLI）は
OpenClaw ツール許可リストを強制できません。CLI が自身のネイティブツールと
独自の権限ポリシーを所有するため、制限を求められた場合 OpenClaw は fail closed します。
CLI-harness モデルに対して Crestodian は代わりに次を行います。

- `crestodian` ツールのみを提供する専用 MCP サーバーを注入し、
  その実行における OpenClaw の通常の MCP ツール面を置き換えます（Claude Code では
  生成された config が `--strict-mcp-config` で適用されるため、他の MCP
  サーバーは読み込まれません）。
- すべての config 変更をツールの承認および監査契約内に保持します。
  読み取りは自由に実行され、書き込みには会話上の yes が必要で、適用された
  すべての書き込みは監査され、再検証されます。
- ネイティブツール（ファイル読み取り、シェル）は harness に任せます。これらは、このマシン上の
  通常の OpenClaw エージェント実行と同じ権限姿勢に従います。
  OpenClaw のデフォルト exec 設定では Claude Code は権限をバイパスして実行され、
  制限された `tools.exec` config は CLI 独自の権限
  ポリシーにフォールバックします。

Crestodian セッションだけが crestodian MCP サーバーを取得します。通常のエージェント実行が
このツールを見ることはありません。CLI-harness モデル上の Crestodian セッションは、同じホスト上の
通常のローカルエージェント実行と同様に扱ってください。ring-zero ツールは config 修復のための
監査済みで承認ゲート付きの経路を追加しますが、harness の
ネイティブツールがファイルを直接触ることを防ぐものではありません。Codex app-server フォールバックと
API キーモデルは厳格な単一ツールループを強制します。強い制限が必要な場合は
それらを優先してください。

## エージェントへの切り替え

自然言語セレクタを使用して Crestodian を離れ、通常の TUI を開きます。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は通常のエージェント TUI を直接開きます。Crestodian は開始しません。通常の TUI に切り替えた後、`/crestodian` は Crestodian に戻ります。必要に応じて後続リクエストを付けられます。

```text
/crestodian
/crestodian restart gateway
```

## メッセージレスキューモード

メッセージレスキューモードは Crestodian のメッセージチャネルエントリポイントです。通常のエージェントが停止しているが、信頼済みチャネル（たとえば WhatsApp）がまだコマンドを受信できる場合に使用します。

対応コマンド: `/crestodian <request>`。

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

エージェント作成はローカルまたはレスキュー経由でもキューに入れられます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモートレスキューは管理者向けの操作面であり、通常のチャットではなくリモート config 修復として扱う必要があります。

リモートレスキューのセキュリティ契約:

- エージェント/セッションでサンドボックス化が有効な場合は無効です。Crestodian はリモートレスキューを拒否し、ローカル CLI 修復を案内します。
- デフォルトの有効状態は `auto` です。ランタイムがすでにサンドボックスなしのローカル権限を持つ、信頼済み YOLO 操作の場合のみリモートレスキューを許可します（`tools.exec.security` が `full` に解決され、`tools.exec.ask` が `off` に解決され、sandbox mode が `off`）。
- 明示的な owner identity が必要です。ワイルドカード送信者ルール、オープングループポリシー、未認証 Webhook、匿名チャネルは不可です。
- デフォルトでは owner DM のみです。グループ/チャネルレスキューには明示的な opt-in が必要です。
- Plugin の検索と一覧表示は読み取り専用です。Plugin install は実行可能コードをダウンロードするため、常にローカル限定です（他の条件で有効な場合でもレスキューではブロックされます）。Plugin uninstall は永続的なレスキュー操作として承認できます。
- リモートレスキューはローカル TUI を開いたり、対話型エージェントセッションに切り替えたりできません。エージェントの引き渡しにはローカルの `openclaw` を使用してください。
- 永続的な書き込みには、レスキューモードでも承認が必要です。
- 適用されたすべてのレスキュー操作は監査されます。メッセージチャネルレスキューはチャネル、アカウント、送信者、送信元アドレスのメタデータを記録します。config を変更する操作では、変更前後の config ハッシュも記録します。
- シークレットは決してエコーされません。SecretRef の検査は値ではなく可用性を報告します。
- Gateway が稼働している場合、レスキューは Gateway の型付き操作を優先します。停止している場合、レスキューは通常のエージェントループに依存しない最小限のローカル修復面のみを使用します。

Config 形状:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"`（デフォルト）は、有効なランタイムが YOLO でサンドボックス化がオフの場合にのみレスキューを許可します。`false` はメッセージチャネルレスキューを一切許可しません。`true` は owner/チャネルチェックに合格した場合にレスキューを明示的に許可します（ただしサンドボックス化による拒否の対象です）。
- `ownerDmOnly`: レスキューを owner のダイレクトメッセージに制限します。デフォルトは `true`。
- `pendingTtlMinutes`: 保留中のレスキュー書き込みが、期限切れになる前に `/crestodian yes` 承認を待つ時間です。デフォルトは `15`。

リモートレスキューは Docker レーンでカバーされています。

```bash
pnpm test:docker:crestodian-rescue
```

Config なしのローカルプランナーフォールバックは次でカバーされています。

```bash
pnpm test:docker:crestodian-planner
```

オプトインのライブチャネルコマンドサーフェススモークは、`/crestodian status` と rescue handler を通じた永続的な承認ラウンドトリップを確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

明示的な Crestodian コマンドによる設定なしのセットアップは、次でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

このレーンは空の state dir から開始し、最新の onboard Crestodian エントリポイントを検証し、デフォルトモデルを設定し、追加のエージェントを作成し、Plugin 有効化と token SecretRef を通じて Discord を設定し、config を検証し、audit log を確認します。QA Lab には、同じ Ring 0 フロー用のリポジトリに裏付けられたシナリオがあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [Sandbox](/ja-JP/cli/sandbox)
- [Security](/ja-JP/cli/security)
