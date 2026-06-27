---
read_when:
    - セットアップ後にコマンドなしで openclaw を実行し、Crestodian について理解したい
    - OpenClawを検査または修復するには、設定なしでも安全に使える方法が必要です。
    - メッセージチャネルのレスキューモードを設計または有効化している
summary: Crestodian の CLI リファレンスとセキュリティモデル。Crestodian は設定不要で安全に使えるセットアップと修復のヘルパーです。
title: クレストディアン
x-i18n:
    generated_at: "2026-06-27T10:53:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian は、OpenClaw のローカルセットアップ、修復、構成ヘルパーです。通常のエージェント経路が壊れている場合でも到達可能なままでいるように設計されています。

アクティブな構成ファイルが存在しない、または作成済み設定がない（空またはメタデータのみ）場合、コマンドなしで `openclaw` を実行すると、まず従来のオンボーディングが開始されます。構成ファイルに作成済み設定がある場合、コマンドなしで `openclaw` を実行すると、対話型ターミナルで Crestodian が起動します。`openclaw crestodian` を実行すると、同じヘルパーを明示的に起動します。

## Crestodian が表示する内容

起動時、対話型 Crestodian は `openclaw tui` と同じ TUI シェルを、Crestodian チャットバックエンド付きで開きます。チャットログは短い挨拶で始まります。

- Crestodian を起動するタイミング
- Crestodian が実際に使用しているモデルまたは決定的プランナー経路
- 構成の有効性とデフォルトエージェント
- 最初の起動プローブから見た Gateway 到達性
- Crestodian が実行できる次のデバッグ操作

起動するためだけにシークレットをダンプしたり、Plugin CLI コマンドを読み込んだりはしません。TUI は引き続き、通常のヘッダー、チャットログ、ステータス行、フッター、オートコンプリート、エディター操作を提供します。

構成パス、ドキュメント/ソースパス、ローカル CLI プローブ、API キーの存在、エージェント、モデル、Gateway の詳細を含む詳しいインベントリには `status` を使用します。

Crestodian は通常のエージェントと同じ OpenClaw 参照検出を使用します。Git チェックアウトでは、ローカルの `docs/` とローカルソースツリーを参照します。npm パッケージインストールでは、同梱されたパッケージドキュメントを使用し、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) へリンクします。ドキュメントだけでは不十分な場合はソースを確認するよう明示的に案内します。

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

Crestodian TUI 内では次のように使用します。

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

## 安全な起動

Crestodian の起動経路は意図的に小さく保たれています。次の場合でも実行できます。

- `openclaw.json` が存在しない
- `openclaw.json` が無効である
- Gateway が停止している
- Plugin コマンド登録を利用できない
- エージェントがまだ構成されていない

`openclaw --help` と `openclaw --version` は引き続き通常の高速経路を使用します。非対話型の裸の `openclaw` は、ルートヘルプを表示する代わりに短いメッセージで終了します。新規インストールでは、このメッセージは非対話型オンボーディングを示します。セットアップ後は、単発の Crestodian コマンドを示します。

## 操作と承認

Crestodian は、構成を場当たり的に編集する代わりに、型付き操作を使用します。

読み取り専用操作はすぐに実行できます。

- 概要を表示
- エージェントを一覧表示
- インストール済み Plugin を一覧表示
- ClawHub Plugin を検索
- モデル/バックエンドステータスを表示
- ステータスまたは健全性チェックを実行
- Gateway 到達性を確認
- 対話型修復なしで doctor を実行
- 構成を検証
- 監査ログパスを表示

永続的な操作には、直接コマンドで `--yes` を渡さない限り、対話型モードで会話による承認が必要です。

- 構成を書き込む
- `config set` を実行
- `config set-ref` を通じてサポートされる SecretRef 値を設定
- セットアップ/オンボーディングのブートストラップを実行
- デフォルトモデルを変更
- Gateway を開始、停止、または再起動
- エージェントを作成
- ClawHub または npm から Plugin をインストール
- Plugin をアンインストール
- 構成または状態を書き換える doctor 修復を実行

適用された書き込みは次に記録されます。

```text
~/.openclaw/audit/crestodian.jsonl
```

検出は監査されません。適用された操作と書き込みのみがログに記録されます。

`openclaw onboard --modern` は、モダンオンボーディングのプレビューとして Crestodian を起動します。通常の `openclaw onboard` は引き続き従来のオンボーディングを実行します。

## セットアップブートストラップ

`setup` は、チャット優先のオンボーディングブートストラップです。型付き構成操作を通じてのみ書き込み、先に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが構成されていない場合、セットアップは次の順序で最初に使用可能なバックエンドを選択し、何を選んだかを伝えます。

- 既存の明示的なモデル（すでに構成済みの場合）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> Codex app-server ハーネス経由の `openai/gpt-5.5`

いずれも利用できない場合でも、セットアップはデフォルトワークスペースを書き込み、モデルは未設定のままにします。Codex/Claude Code をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、セットアップを再実行してください。

## モデル支援プランナー

Crestodian は常に決定的モードで起動します。決定的パーサーが理解できない曖昧なコマンドについては、ローカル Crestodian が OpenClaw の通常のランタイム経路を通じて、範囲を限定したプランナーターンを 1 回実行できます。まず構成済みの OpenClaw モデルを使用します。使用可能な構成済みモデルがまだない場合は、マシン上にすでに存在するローカルランタイムへフォールバックできます。

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Codex app-server ハーネス: `openai/gpt-5.5`

モデル支援プランナーは構成を直接変更できません。リクエストを Crestodian の型付きコマンドのいずれかに変換する必要があり、その後は通常の承認ルールと監査ルールが適用されます。Crestodian は、何かを実行する前に、使用したモデルと解釈されたコマンドを表示します。構成なしのフォールバックプランナーターンは一時的で、ランタイムが対応している場合はツール無効で実行され、一時ワークスペース/セッションを使用します。

メッセージチャネルレスキューモードでは、モデル支援プランナーは使用しません。壊れた、または侵害された通常のエージェント経路が構成エディターとして使われないよう、リモートレスキューは決定的なままです。

## エージェントへの切り替え

Crestodian を離れて通常の TUI を開くには、自然言語セレクターを使用します。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は引き続き通常のエージェント TUI を直接開きます。Crestodian は起動しません。

通常の TUI に切り替えた後、Crestodian に戻るには `/crestodian` を使用します。後続リクエストを含めることもできます。

```text
/crestodian
/crestodian restart gateway
```

TUI 内のエージェント切り替えでは、`/crestodian` が利用可能であることを示すパンくずが残ります。

## メッセージレスキューモード

メッセージレスキューモードは、Crestodian のメッセージチャネルエントリーポイントです。通常のエージェントが停止しているが、WhatsApp などの信頼済みチャネルがまだコマンドを受信できる場合のためのものです。

サポートされるテキストコマンド:

- `/crestodian <request>`

オペレーターフロー:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

エージェント作成は、ローカルプロンプトまたはレスキューモードからキューに入れることもできます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモートレスキューモードは管理者サーフェスです。通常のチャットではなく、リモート構成修復として扱う必要があります。

リモートレスキューのセキュリティ契約:

- サンドボックス化が有効な場合は無効です。エージェント/セッションがサンドボックス化されている場合、Crestodian はリモートレスキューを拒否し、ローカル CLI 修復が必要であることを説明する必要があります。
- デフォルトの実効状態は `auto` です。ランタイムがすでにサンドボックスなしのローカル権限を持つ、信頼済み YOLO 操作でのみリモートレスキューを許可します。
- 明示的な所有者 ID が必要です。レスキューは、ワイルドカード送信者ルール、オープングループポリシー、未認証 Webhook、匿名チャネルを受け入れてはいけません。
- デフォルトでは所有者 DM のみです。グループ/チャネルレスキューには明示的なオプトインが必要です。
- Plugin 検索と一覧表示は読み取り専用です。Plugin インストールは実行可能コードをダウンロードするため、デフォルトではローカル専用です。Plugin アンインストールは、レスキューポリシーが永続的な書き込みを許可する場合、承認済み修復操作として許可できます。
- リモートレスキューはローカル TUI を開いたり、対話型エージェントセッションに切り替えたりできません。エージェント引き継ぎにはローカルの `openclaw` を使用してください。
- レスキューモードでも、永続的な書き込みには引き続き承認が必要です。
- 適用されたすべてのレスキュー操作を監査します。メッセージチャネルレスキューは、チャネル、アカウント、送信者、送信元アドレスのメタデータを記録します。構成を変更する操作は、変更前後の構成ハッシュも記録します。
- シークレットを決してエコーしません。SecretRef の検査では、値ではなく利用可否を報告する必要があります。
- Gateway が稼働している場合は、Gateway の型付き操作を優先します。Gateway が停止している場合は、通常のエージェントループに依存しない最小限のローカル修復サーフェスのみを使用します。

構成形状:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` は次を受け入れる必要があります。

- `"auto"`: デフォルト。実効ランタイムが YOLO で、サンドボックス化がオフの場合にのみ許可します。
- `false`: メッセージチャネルレスキューを決して許可しません。
- `true`: 所有者/チャネルチェックに合格した場合にレスキューを明示的に許可します。ただし、サンドボックス化による拒否をバイパスしてはなりません。

デフォルトの `"auto"` YOLO 状態は次のとおりです。

- サンドボックスモードが `off` に解決される
- `tools.exec.security` が `full` に解決される
- `tools.exec.ask` が `off` に解決される

リモートレスキューは Docker レーンでカバーされています。

```bash
pnpm test:docker:crestodian-rescue
```

構成なしのローカルプランナーフォールバックは次でカバーされています。

```bash
pnpm test:docker:crestodian-planner
```

オプトインのライブチャネルコマンドサーフェススモークは、`/crestodian status` と、レスキューハンドラーを通じた永続的な承認ラウンドトリップを確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

明示的な Crestodian コマンドによる構成なしセットアップは次でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

このレーンは空の状態ディレクトリから開始し、モダンオンボーディングの Crestodian エントリーポイントを検証し、デフォルトモデルを設定し、追加のエージェントを作成し、Plugin 有効化とトークン SecretRef によって Discord を構成し、構成を検証し、監査ログを確認します。QA Lab にも、同じ Ring 0 フローのリポジトリベースシナリオがあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [サンドボックス](/ja-JP/cli/sandbox)
- [セキュリティ](/ja-JP/cli/security)
