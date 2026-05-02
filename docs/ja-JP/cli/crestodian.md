---
read_when:
    - コマンドを指定せずに openclaw を実行していて、Crestodian について理解したい
    - OpenClawを検査または修復するための、設定なしでも安全な方法が必要です
    - メッセージチャネルのレスキューモードを設計または有効化している
summary: Crestodian の CLI リファレンスとセキュリティモデル。設定なしでも安全なセットアップおよび修復ヘルパー
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T04:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian は OpenClaw のローカルセットアップ、修復、設定ヘルパーです。通常のエージェント経路が壊れている場合でも到達できるように設計されています。

コマンドなしで `openclaw` を実行すると、対話型ターミナルで Crestodian が起動します。
`openclaw crestodian` を実行すると、同じヘルパーを明示的に起動します。

## Crestodian が表示する内容

起動時に、対話型の Crestodian は `openclaw tui` で使われるものと同じ TUI シェルを、Crestodian チャットバックエンドで開きます。チャットログは短い挨拶から始まります。

- Crestodian を起動すべきタイミング
- Crestodian が実際に使用しているモデルまたは決定的プランナー経路
- 設定の妥当性とデフォルトエージェント
- 最初の起動プローブから見た Gateway の到達可能性
- Crestodian が実行できる次のデバッグアクション

起動するためだけにシークレットをダンプしたり、Plugin CLI コマンドを読み込んだりすることはありません。TUI は引き続き通常のヘッダー、チャットログ、ステータス行、フッター、オートコンプリート、エディター操作を提供します。

設定パス、docs/source パス、ローカル CLI プローブ、API キーの存在、エージェント、モデル、Gateway の詳細を含む詳細なインベントリには `status` を使用します。

Crestodian は通常のエージェントと同じ OpenClaw 参照検出を使用します。Git チェックアウトでは、ローカルの `docs/` とローカルソースツリーを指します。npm パッケージインストールでは、同梱パッケージのドキュメントを使用し、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) にリンクします。ドキュメントだけでは不十分な場合はソースを確認するよう明示的に案内します。

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

Crestodian TUI 内:

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

- `openclaw.json` がない
- `openclaw.json` が無効
- Gateway が停止している
- Plugin コマンド登録が利用できない
- エージェントがまだ設定されていない

`openclaw --help` と `openclaw --version` は引き続き通常の高速経路を使用します。
非対話型の `openclaw` はルートヘルプを出力する代わりに短いメッセージで終了します。コマンドなしの製品は Crestodian だからです。

## 操作と承認

Crestodian はアドホックに設定を編集する代わりに、型付き操作を使用します。

読み取り専用操作はすぐに実行できます。

- 概要を表示
- エージェントを一覧表示
- インストール済み Plugin を一覧表示
- ClawHub Plugin を検索
- モデル/バックエンドの状態を表示
- ステータスまたはヘルスチェックを実行
- Gateway の到達可能性を確認
- 対話型修正なしで doctor を実行
- 設定を検証
- 監査ログのパスを表示

永続的な操作は、直接コマンドで `--yes` を渡さない限り、対話モードで会話による承認が必要です。

- 設定を書き込む
- `config set` を実行
- `config set-ref` でサポートされる SecretRef 値を設定
- セットアップ/オンボーディングのブートストラップを実行
- デフォルトモデルを変更
- Gateway を開始、停止、または再起動
- エージェントを作成
- ClawHub または npm から Plugin をインストール
- Plugin をアンインストール
- 設定または状態を書き換える doctor 修復を実行

適用された書き込みは次に記録されます。

```text
~/.openclaw/audit/crestodian.jsonl
```

検出は監査されません。適用された操作と書き込みのみがログに記録されます。

`openclaw onboard --modern` は Crestodian をモダンなオンボーディングプレビューとして起動します。
通常の `openclaw onboard` は引き続きクラシックなオンボーディングを実行します。

## セットアップブートストラップ

`setup` はチャット優先のオンボーディングブートストラップです。型付き設定操作を通してのみ書き込み、先に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが設定されていない場合、setup は次の順序で最初に使用可能なバックエンドを選択し、選択内容を通知します。

- 既存の明示的なモデル（すでに設定済みの場合）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

どれも利用できない場合でも、setup はデフォルトワークスペースを書き込み、モデルは未設定のままにします。Codex/Claude Code をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、setup を再実行してください。

## モデル支援プランナー

Crestodian は常に決定的モードで起動します。決定的パーサーが理解できない曖昧なコマンドについては、ローカルの Crestodian が OpenClaw の通常ランタイム経路を通じて、境界付けされたプランナーターンを 1 回実行できます。まず設定済みの OpenClaw モデルを使用します。使用可能な設定済みモデルがまだない場合は、マシン上にすでに存在するローカルランタイムにフォールバックできます。

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server ハーネス: `agentRuntime.id: "codex"` を指定した `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

モデル支援プランナーは設定を直接変更できません。リクエストを Crestodian の型付きコマンドのいずれかに変換する必要があり、その後は通常の承認ルールと監査ルールが適用されます。Crestodian は何かを実行する前に、使用したモデルと解釈されたコマンドを出力します。設定なしのフォールバックプランナーターンは一時的で、ランタイムがサポートする場合はツール無効で、一時ワークスペース/セッションを使用します。

メッセージチャネルのレスキューモードはモデル支援プランナーを使用しません。リモートレスキューは決定的なままなので、壊れた、または侵害された通常のエージェント経路を設定エディターとして使うことはできません。

## エージェントへの切り替え

自然言語のセレクターを使って Crestodian を離れ、通常の TUI を開きます。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は引き続き通常のエージェント TUI を直接開きます。Crestodian は起動しません。

通常の TUI に切り替えた後は、`/crestodian` を使って Crestodian に戻ります。フォローアップリクエストを含めることもできます。

```text
/crestodian
/crestodian restart gateway
```

TUI 内のエージェント切り替えでは、`/crestodian` が利用できるというパンくずが残ります。

## メッセージレスキューモード

メッセージレスキューモードは、Crestodian のメッセージチャネル用エントリポイントです。通常のエージェントが停止しているが、WhatsApp などの信頼済みチャネルがまだコマンドを受信できる場合に使用します。

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

エージェント作成はローカルプロンプトまたはレスキューモードからキューに入れることもできます。

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

リモートレスキューモードは管理者向けサーフェスです。通常のチャットではなく、リモート設定修復として扱う必要があります。

リモートレスキューのセキュリティ契約:

- サンドボックスが有効な場合は無効。エージェント/セッションがサンドボックス化されている場合、Crestodian はリモートレスキューを拒否し、ローカル CLI 修復が必要であることを説明する必要があります。
- デフォルトの有効状態は `auto`: ランタイムがすでにサンドボックスなしのローカル権限を持つ、信頼済み YOLO 操作でのみリモートレスキューを許可します。
- 明示的な所有者 ID が必要。レスキューはワイルドカード送信者ルール、公開グループポリシー、未認証 Webhook、匿名チャネルを受け入れてはなりません。
- デフォルトでは所有者 DM のみ。グループ/チャネルレスキューには明示的なオプトインが必要です。
- Plugin 検索と一覧表示は読み取り専用です。Plugin インストールは実行可能コードをダウンロードするため、デフォルトではローカル専用です。Plugin アンインストールは、レスキューポリシーが永続的な書き込みを許可する場合、承認済み修復操作として許可できます。
- リモートレスキューはローカル TUI を開いたり、対話型エージェントセッションに切り替えたりできません。エージェント引き継ぎにはローカルの `openclaw` を使用してください。
- レスキューモードでも、永続的な書き込みには引き続き承認が必要です。
- 適用されたすべてのレスキュー操作を監査します。メッセージチャネルレスキューはチャネル、アカウント、送信者、送信元アドレスのメタデータを記録します。設定を変更する操作は、変更前後の設定ハッシュも記録します。
- シークレットをエコーしないでください。SecretRef の検査では値ではなく可用性を報告する必要があります。
- Gateway が生きている場合は、Gateway の型付き操作を優先します。Gateway が停止している場合は、通常のエージェントループに依存しない最小限のローカル修復サーフェスのみを使用します。

設定形状:

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

- `"auto"`: デフォルト。有効なランタイムが YOLO で、サンドボックスがオフの場合のみ許可します。
- `false`: メッセージチャネルレスキューを決して許可しません。
- `true`: 所有者/チャネルチェックに合格した場合にレスキューを明示的に許可します。ただし、これはサンドボックスによる拒否を迂回してはなりません。

デフォルトの `"auto"` YOLO 姿勢は次のとおりです。

- サンドボックスモードが `off` に解決される
- `tools.exec.security` が `full` に解決される
- `tools.exec.ask` が `off` に解決される

リモートレスキューは Docker レーンでカバーされています。

```bash
pnpm test:docker:crestodian-rescue
```

設定なしのローカルプランナーフォールバックは次でカバーされています。

```bash
pnpm test:docker:crestodian-planner
```

オプトインのライブチャネルコマンドサーフェススモークは、`/crestodian status` と、レスキューハンドラーを通した永続的な承認往復を確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian 経由の新規設定なしセットアップは次でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

そのレーンは空の状態ディレクトリから始まり、素の `openclaw` を Crestodian にルーティングし、デフォルトモデルを設定し、追加エージェントを作成し、Plugin 有効化とトークン SecretRef を通じて Discord を設定し、設定を検証し、監査ログを確認します。QA Lab には同じ Ring 0 フロー用のリポジトリベースのシナリオもあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [サンドボックス](/ja-JP/cli/sandbox)
- [セキュリティ](/ja-JP/cli/security)
