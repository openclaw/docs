---
read_when:
    - コマンドを指定せずに openclaw を実行しており、Crestodian について理解したい
    - OpenClaw を検査または修復するための、設定なしでも安全な方法が必要です
    - メッセージチャネルのレスキューモードを設計または有効化している
summary: 設定不要でも安全なセットアップおよび修復ヘルパーである Crestodian の CLI リファレンスとセキュリティモデル
title: クレストディアン
x-i18n:
    generated_at: "2026-04-30T05:03:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian は、OpenClaw のローカルセットアップ、修復、設定ヘルパーです。通常のエージェント経路が壊れている場合でも到達可能なままでいるように設計されています。

コマンドなしで `openclaw` を実行すると、対話型ターミナルで Crestodian が起動します。
`openclaw crestodian` を実行すると、同じヘルパーを明示的に起動します。

## Crestodian が表示する内容

起動時、対話型 Crestodian は `openclaw tui` と同じ TUI シェルを、Crestodian チャットバックエンド付きで開きます。チャットログは短い挨拶から始まります。

- Crestodian を起動するタイミング
- Crestodian が実際に使用しているモデルまたは決定論的プランナー経路
- 設定の妥当性とデフォルトエージェント
- 最初の起動プローブから見た Gateway 到達可能性
- Crestodian が実行できる次のデバッグアクション

起動するためだけにシークレットをダンプしたり、plugin CLI コマンドを読み込んだりはしません。TUI は引き続き、通常のヘッダー、チャットログ、ステータス行、フッター、オートコンプリート、エディター操作を提供します。

設定パス、docs/ソースパス、ローカル CLI プローブ、API キーの存在、エージェント、モデル、Gateway の詳細を含む詳しいインベントリには `status` を使用します。

Crestodian は通常のエージェントと同じ OpenClaw 参照探索を使用します。Git チェックアウトでは、ローカルの `docs/` とローカルソースツリーを指します。npm パッケージインストールでは、同梱されたパッケージドキュメントを使用し、[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) にリンクします。ドキュメントだけでは不十分な場合はソースを確認するよう明示的に案内します。

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

Crestodian TUI 内では次のように使います。

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全な起動

Crestodian の起動経路は意図的に小さく保たれています。次の場合でも実行できます。

- `openclaw.json` が存在しない
- `openclaw.json` が無効
- Gateway が停止している
- plugin コマンド登録が利用できない
- エージェントがまだ設定されていない

`openclaw --help` と `openclaw --version` は引き続き通常の高速経路を使用します。非対話型の `openclaw` は、ルートヘルプを表示する代わりに短いメッセージで終了します。コマンドなしのプロダクトは Crestodian だからです。

## 操作と承認

Crestodian は設定をその場しのぎで編集する代わりに、型付き操作を使用します。

読み取り専用操作はすぐに実行できます。

- 概要を表示
- エージェントを一覧表示
- モデル/バックエンドのステータスを表示
- ステータスまたはヘルスチェックを実行
- Gateway 到達可能性を確認
- 対話型修正なしで doctor を実行
- 設定を検証
- 監査ログのパスを表示

永続的な操作には、直接コマンドで `--yes` を渡さない限り、対話モードで会話による承認が必要です。

- 設定を書き込む
- `config set` を実行
- `config set-ref` を通じてサポートされる SecretRef 値を設定
- セットアップ/オンボーディングのブートストラップを実行
- デフォルトモデルを変更
- Gateway を起動、停止、または再起動
- エージェントを作成
- 設定または状態を書き換える doctor 修復を実行

適用された書き込みは次に記録されます。

```text
~/.openclaw/audit/crestodian.jsonl
```

探索は監査されません。適用された操作と書き込みだけがログに記録されます。

`openclaw onboard --modern` は、モダンなオンボーディングプレビューとして Crestodian を起動します。通常の `openclaw onboard` は引き続きクラシックなオンボーディングを実行します。

## セットアップブートストラップ

`setup` はチャット優先のオンボーディングブートストラップです。型付き設定操作を通じてのみ書き込み、最初に承認を求めます。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

モデルが設定されていない場合、setup は次の順序で最初に使用可能なバックエンドを選択し、何を選んだかを伝えます。

- 既存の明示的なモデルがすでに設定されている場合はそれ
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

どれも利用できない場合でも、setup はデフォルトワークスペースを書き込み、モデルは未設定のままにします。Codex/Claude Code をインストールまたはログインするか、`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` を公開してから、setup を再実行してください。

## モデル支援プランナー

Crestodian は常に決定論的モードで起動します。決定論的パーサーが理解できないあいまいなコマンドに対して、ローカルの Crestodian は OpenClaw の通常のランタイム経路を通じて、境界付けられたプランナーターンを 1 回実行できます。まず、設定済みの OpenClaw モデルを使用します。使用可能な設定済みモデルがまだない場合は、マシン上にすでに存在するローカルランタイムへフォールバックできます。

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex アプリサーバーハーネス: `agentRuntime.id: "codex"` の `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

モデル支援プランナーは設定を直接変更できません。リクエストを Crestodian の型付きコマンドのいずれかへ変換する必要があり、その後は通常の承認ルールと監査ルールが適用されます。Crestodian は何かを実行する前に、使用したモデルと解釈されたコマンドを表示します。設定なしのフォールバックプランナーターンは一時的で、ランタイムが対応する場合はツール無効化され、一時ワークスペース/セッションを使用します。

メッセージチャネルレスキューモードはモデル支援プランナーを使用しません。壊れた、または侵害された通常のエージェント経路が設定エディターとして使われないよう、リモートレスキューは決定論的なままです。

## エージェントへの切り替え

Crestodian を離れて通常の TUI を開くには、自然言語セレクターを使用します。

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat`、`openclaw terminal` は引き続き通常のエージェント TUI を直接開きます。Crestodian は起動しません。

通常の TUI に切り替えた後、Crestodian に戻るには `/crestodian` を使用します。続けてリクエストを含めることもできます。

```text
/crestodian
/crestodian restart gateway
```

TUI 内のエージェント切り替えでは、`/crestodian` が利用可能であることを示すパンくずが残ります。

## メッセージレスキューモード

メッセージレスキューモードは、Crestodian のメッセージチャネル用エントリーポイントです。通常のエージェントが停止しているが、WhatsApp などの信頼済みチャネルではまだコマンドを受信できる場合のためのものです。

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

リモートレスキューモードは管理者向けサーフェスです。通常のチャットではなく、リモート設定修復として扱う必要があります。

リモートレスキューのセキュリティ契約:

- サンドボックスが有効な場合は無効です。エージェント/セッションがサンドボックス化されている場合、Crestodian はリモートレスキューを拒否し、ローカル CLI 修復が必要であることを説明する必要があります。
- デフォルトの有効状態は `auto` です。リモートレスキューは、ランタイムがすでにサンドボックスなしのローカル権限を持っている、信頼済み YOLO 操作でのみ許可します。
- 明示的な所有者 ID が必要です。レスキューは、ワイルドカード送信者ルール、オープングループポリシー、未認証 Webhook、匿名チャネルを受け入れてはいけません。
- デフォルトでは所有者 DM のみです。グループ/チャネルレスキューには明示的なオプトインが必要です。
- リモートレスキューはローカル TUI を開いたり、対話型エージェントセッションへ切り替えたりできません。エージェント引き渡しにはローカルの `openclaw` を使用してください。
- 永続的な書き込みには、レスキューモードでも承認が必要です。
- 適用されたすべてのレスキュー操作を監査します。メッセージチャネルレスキューは、チャネル、アカウント、送信者、送信元アドレスのメタデータを記録します。設定を変更する操作は、変更前後の設定ハッシュも記録します。
- シークレットを決してエコーしないでください。SecretRef の検査では、値ではなく利用可否を報告する必要があります。
- Gateway が生存している場合は、Gateway の型付き操作を優先します。Gateway が停止している場合は、通常のエージェントループに依存しない最小限のローカル修復サーフェスだけを使用します。

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

- `"auto"`: デフォルトです。有効なランタイムが YOLO で、サンドボックスがオフの場合にのみ許可します。
- `false`: メッセージチャネルレスキューを一切許可しません。
- `true`: 所有者/チャネルチェックを通過した場合にレスキューを明示的に許可します。ただし、サンドボックス拒否を迂回してはいけません。

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

オプトインのライブチャネルコマンドサーフェススモークは、`/crestodian status` と、レスキューハンドラーを通じた永続的な承認ラウンドトリップを確認します。

```bash
pnpm test:live:crestodian-rescue-channel
```

Crestodian を通じた新規の設定なしセットアップは次でカバーされています。

```bash
pnpm test:docker:crestodian-first-run
```

このレーンは空の状態ディレクトリから開始し、素の `openclaw` を Crestodian へルーティングし、デフォルトモデルを設定し、追加のエージェントを作成し、plugin 有効化とトークン SecretRef を通じて Discord を設定し、設定を検証し、監査ログを確認します。QA Lab にも同じ Ring 0 フロー用のリポジトリ裏付けシナリオがあります。

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/cli/doctor)
- [TUI](/ja-JP/cli/tui)
- [サンドボックス](/ja-JP/cli/sandbox)
- [セキュリティ](/ja-JP/cli/security)
