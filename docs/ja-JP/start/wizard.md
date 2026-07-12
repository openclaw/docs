---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: CLI オンボーディング：推論を検証してから、残りのセットアップを Crestodian に引き継ぐ
title: オンボーディング（CLI）
x-i18n:
    generated_at: "2026-07-11T22:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI オンボーディングは、macOS、Linux、Windows（ネイティブまたは WSL2）で推奨されるターミナルセットアップ手順です。デフォルトでは、マシン上ですでに利用可能な AI アクセスを検出し、実際の補完で検証してから Crestodian を起動し、ワークスペース、Gateway、オプション機能を設定します。`openclaw setup` でも同じフローが実行されます（設定のみを行う `--baseline` バリアントについては [セットアップ](/ja-JP/cli/setup) を参照してください）。Windows デスクトップユーザーは [Windows Hub](/ja-JP/platforms/windows) から開始することもできます。

ガイド付きオンボーディングでは、最初に推論を確立します。利用可能な AI アクセスを検出し、実際の補完を必須としたうえで、その後にのみ [Crestodian](/ja-JP/cli/crestodian) を起動して OpenClaw の残りを設定します。ガイド付きフローには、推論前に Crestodian を起動する経路や AI をスキップする経路はありません。

従来のウィザードは、プロバイダーへのサインイン、リモート Gateway のセットアップ、チャンネルのペアリング、デーモン制御、Skills、インポートに引き続き利用できます。`openclaw onboard --classic` で明示的に実行してください。ガイド付き推論の候補画面から従来のウィザードへ処理が委譲されることはありません。推論に成功すると、Crestodian は `open channel wizard for <channel>` を使用して、シークレットが必要なチャンネル設定を入力内容がマスクされるターミナルウィザードへ引き渡せます。モデルプロバイダーまたはその認証を変更するには、Crestodian を終了して `openclaw onboard` を実行してください。Crestodian からガイド付きまたは従来のプロバイダーフローを開くことはできません。

<Info>
最速で最初のチャットを始めるには、ガイド付きセットアップを完了し、`openclaw dashboard` を実行して、ブラウザーのコントロール UI からチャットします。ドキュメント：[ダッシュボード](/ja-JP/web/dashboard)。
</Info>

## ロケール

ウィザードは、オンボーディングで使用する固定文言をローカライズします。解決順序は `OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`、最後に英語です。対応ロケール：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

製品名、コマンド、設定キー、URL、プロバイダー ID、モデル ID、Plugin／チャンネルのラベルは、ロケールにかかわらず英語のままです。

推論以外の設定を後から再構成するには、次を実行します。

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` を指定しても非対話モードにはなりません。スクリプトでは `--non-interactive` を使用してください（[CLI 自動化](/ja-JP/start/wizard-cli-automation) を参照）。
</Note>

<Tip>
従来のウィザードには、プロバイダーを選択できるウェブ検索手順があります：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily。一部には API キーが必要ですが、キーなしで利用できるものもあります。後から `openclaw configure --section web` で設定できます。ドキュメント：[ウェブツール](/ja-JP/tools/web)。
</Tip>

## デフォルトのガイド付きフロー

通常の `openclaw onboard` は、次の手順で進みます。

1. セキュリティ通知に同意します。
2. 設定済みモデル、API キーの環境変数、対応するローカル AI CLI を検出します。
3. 最初に検出された候補を実際の補完でテストします。失敗した場合は理由を表示し、次の利用可能な候補へ進みます。
4. 検出候補をすべて試しても成功しなかった場合は、検出済みの候補を再試行するか、入力内容がマスクされるプロンプトでプロバイダーの API キーを入力します。ガイド付きオンボーディングでは、推論が動作するまで Crestodian の起動や AI をスキップして終了する選択肢は提示されません。
5. 検証済みのモデルルートと、それに必要な資格情報／Plugin の状態のみを保存します。ワークスペースと Gateway の設定は変更されません。
6. 検証済みモデルで Crestodian を起動し、ワークスペース、Gateway、チャンネル、エージェント、Plugin、残りのオプション設定を構成できるようにします。

設定済みの環境でコマンドを再実行すると、現在のデフォルトモデルが最初にテストされるため、ガイド付きフローが検証と修復の手順として機能します。チェックに失敗しても、設定済みモデルが自動的に置き換えられることはありません。オンボーディングは停止し、続行方法を確認します。推論以外の項目を後から追加するには `openclaw channels add` または `openclaw configure` を実行し、プロバイダーまたは認証ルートを変更するには `openclaw onboard` を使用してください。

## 従来のウィザード：クイックスタートと詳細設定

完全なウィザードを開くには `openclaw onboard --classic` を実行します。最初に **クイックスタート**（デフォルト設定）と **詳細設定**（完全な制御）のどちらかを選択します。`--flow quickstart` または `--flow advanced`（別名 `manual`）を渡すと、従来のフローを選択し、この確認を省略できます。

<Tabs>
  <Tab title="クイックスタート（デフォルト設定）">
    - ローカル Gateway、ループバックへのバインド
    - デフォルトのワークスペース（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **トークン**（ループバックでも自動生成）
    - ツールポリシー：新規セットアップでは `tools.profile: "coding"`（既存の明示的なプロファイルは維持されます）
    - DM の分離：新規セットアップでは `session.dmScope: "per-channel-peer"`。詳細：[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram と WhatsApp の DM はデフォルトで **許可リスト**：Telegram では数値の Telegram ユーザー ID、WhatsApp では電話番号の入力を求められます

  </Tab>
  <Tab title="詳細設定（完全な制御）">
    - モード、ワークスペース、Gateway、チャンネル、デーモン、Skills のすべての手順を表示します

  </Tab>
</Tabs>

リモートモード（`--mode remote`）では常に詳細設定フローが使用されます。このマシンが別の場所にある Gateway へ接続するよう設定するだけであり、リモートホストには何もインストールせず、変更も加えません。

## 従来のオンボーディングで設定される内容

ローカルモード（デフォルト）では、次の手順を進みます。

1. **モデル／認証** - プロバイダーの認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します。カスタムプロバイダー（OpenAI 互換、OpenAI Responses 互換、Anthropic 互換、または不明として自動検出）も選択できます。デフォルトモデルを選択します。
   OpenAI API キーを新規設定する場合、デフォルトは `openai/gpt-5.6` です（修飾なしの直接 API ID は Sol に解決されます）。ChatGPT／Codex を新規設定する場合、デフォルトは `openai/gpt-5.6-sol` です。セットアップを再実行した場合は、`openai/gpt-5.5` を含む既存の明示的なモデル設定が維持されます。アカウントで GPT-5.6 が提供されていない場合は、`openai/gpt-5.5` を明示的に選択してください。
   セキュリティ上の注意：このエージェントがツールを実行する場合や Webhook／フックの内容を処理する場合は、利用可能な最新世代のうち最も強力なモデルを選び、ツールポリシーを厳格に保ってください。性能が低いモデルや古い世代は、プロンプトインジェクションの影響を受けやすくなります。
   非対話実行では、`--secret-input-mode ref` を指定すると、API キーの平文値ではなく環境変数を参照する参照情報が保存されます。参照先の環境変数はあらかじめ設定されている必要があり、設定されていない場合はオンボーディングが即座に失敗します。対話型のシークレット参照モードでは、環境変数または設定済みプロバイダーの参照（`file` または `exec`）を指定でき、保存前に簡単な事前チェックが行われます。モデル／認証のセットアップ後、ウィザードはオプションとして実際の補完テストを提示します。失敗した場合は、一度だけモデル／認証のセットアップへ戻るか、失敗を無視して従来のウィザードの残りを続行できます。失敗を無視しても Crestodian は利用可能になりません。対話形式のセットアップには、引き続き推論チェックへの合格が必要です。
2. **ワークスペース** - エージェントファイルを格納するディレクトリ（デフォルトは `~/.openclaw/workspace`）。ブートストラップファイルを初期配置します。
3. **Gateway** - ポート、バインドアドレス、認証モード、Tailscale 公開を設定します。対話型のトークンモードでは、トークンを平文で保存する（デフォルト）か、SecretRef の使用を選択します。非対話型の SecretRef の指定方法：`--gateway-token-ref-env <ENV_VAR>`。
4. **チャンネル** - Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp など、組み込みおよび公式 Plugin のチャットチャンネルを設定します。
5. **デーモン** - LaunchAgent（macOS）、systemd ユーザーユニット（Linux／WSL2）、またはユーザーごとのスタートアップフォルダーへのフォールバックを備えたネイティブの Windows スケジュールタスクをインストールします。
   トークン認証が必要で、`gateway.auth.token` が SecretRef で管理されている場合、デーモンのインストール時にその参照は検証されますが、解決済みトークンがスーパーバイザーサービスの環境メタデータへ保存されることはありません。SecretRef を解決できない場合は、対処方法を示してインストールを停止します。`gateway.auth.mode` が未設定のまま `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合は、モードを明示的に設定するまでインストールが停止されます。
6. **ヘルスチェック** - Gateway を起動し、接続可能であることを検証します。
7. **Skills** - 推奨される Skills と、そのオプション依存関係をインストールします。

<Note>
オンボーディングを再実行しても、**リセット**を明示的に選択する（または `--reset` を渡す）まで、何も消去されません。CLI の `--reset` は、デフォルトで設定、資格情報、セッションをリセットします。ワークスペースも削除するには `--reset-scope full` を使用してください。設定が無効であるか、レガシーキーが含まれている場合、オンボーディングは最初に `openclaw doctor` を実行するよう求めます。
</Note>

`--flow import` は、新規セットアップの代わりに、検出された移行フロー（Hermes など）を従来のウィザードで実行します。[移行](/ja-JP/cli/migrate) および [インストール](/ja-JP/install/migrating-hermes) 配下の移行ガイドを参照してください。`openclaw onboard --modern` は [Crestodian](/ja-JP/cli/crestodian) の互換性エイリアスです。`openclaw crestodian` と同じ推論ゲートを使用します。推論が検証されるとアシスタントが起動し、対話型の検証に失敗した場合はガイド付き推論セットアップへ戻ります。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用すると、独自のワークスペース、セッション、認証プロファイルを持つ別のエージェントを作成できます。`--workspace` を指定せずに実行すると、名前、ワークスペース、認証、チャンネル、バインディングを設定する対話型フローが開始されます。これは完全な `openclaw onboard` ウィザードではありません。

設定される項目：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意：

- デフォルトのワークスペース：`~/.openclaw/workspace-<agentId>`（`agents.defaults.workspace` が設定されている場合は、その配下）。
- 受信メッセージをこのエージェントへルーティングするには `bindings` を追加します（オンボーディングで設定することもできます）。
- 非対話型フラグ：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

手順ごとの詳細な動作と設定出力については、[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference) を参照してください。
非対話型の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation) を参照してください。
すべてのフラグについては、[`openclaw onboard`](/ja-JP/cli/onboard) を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス：[`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディングの概要：[オンボーディングの概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング：[オンボーディング](/ja-JP/start/onboarding)
- エージェントの初回起動手順：[エージェントのブートストラップ](/ja-JP/start/bootstrapping)
