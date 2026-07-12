---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: CLI オンボーディング：推論を検証してから、残りのセットアップを Crestodian に引き継ぐ
title: オンボーディング（CLI）
x-i18n:
    generated_at: "2026-07-12T14:51:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI オンボーディングは、macOS、Linux、Windows（ネイティブまたは WSL2）で推奨されるターミナルセットアップ手順です。デフォルトでは、マシン上ですでに利用可能な AI アクセスを検出し、実際の補完で検証してから、Crestodian を起動してワークスペース、Gateway、オプション機能を構成します。`openclaw setup` でも同じフローが実行されます（[`--baseline` の構成専用バリアントについては「セットアップ」](/ja-JP/cli/setup)を参照してください）。Windows デスクトップユーザーは、[Windows Hub](/ja-JP/platforms/windows)から開始することもできます。

ガイド付きオンボーディングでは、まず推論を確立します。利用可能な AI アクセスを検出し、
実際の補完が成功することを必須としたうえで、OpenClaw の残りの設定を行うために
[Crestodian](/ja-JP/cli/crestodian) を起動します。ガイド付きフローには、推論前に Crestodian を
起動する経路も、AI をスキップする経路もありません。

従来のウィザードは、プロバイダーへのサインイン、リモート Gateway のセットアップ、チャンネルのペアリング、デーモンの制御、Skills、インポートで引き続き利用できます。`openclaw onboard --classic` を使用して明示的に実行してください。ガイド付き推論の候補画面から、このウィザードに処理が委譲されることはありません。推論に成功した後、Crestodian は `open channel
wizard for <channel>` を使用して、シークレットを必要とするチャンネルのセットアップを入力内容がマスクされるターミナルウィザードに引き渡すことができます。モデルプロバイダーまたはその認証を変更するには、Crestodian を終了して `openclaw onboard` を実行してください。Crestodian は、ガイド付きまたは従来のプロバイダーフローを開きません。

<Info>
最速で最初のチャットを始めるには、ガイド付きセットアップを完了し、`openclaw dashboard` を実行して、Control UI からブラウザ上でチャットします。ドキュメント：[ダッシュボード](/ja-JP/web/dashboard)。
</Info>

## ロケール

ウィザードは、オンボーディングで使用される固定文言をローカライズします。解決順序は、`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`、英語の順です。サポートされるロケール：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

製品名、コマンド、設定キー、URL、プロバイダー ID、モデル ID、およびPlugin／チャンネルのラベルは、ロケールにかかわらず英語のままです。

推論以外の設定を後で再構成するには、次を実行します。

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` を指定しても、非対話モードにはなりません。スクリプトでは `--non-interactive` を使用してください（[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照）。
</Note>

<Tip>
従来のウィザードには Web 検索の手順があり、Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily のいずれかのプロバイダーを選択できます。API キーが必要なものもあれば、キーなしで利用できるものもあります。後で `openclaw configure --section web` を使用して構成できます。ドキュメント：[Web ツール](/ja-JP/tools/web)。
</Tip>

## ガイド付きのデフォルト

通常の `openclaw onboard` は、次の手順で進みます。

1. セキュリティに関する通知に同意します。
2. 構成済みのモデル、API キーの環境変数、サポートされているローカル AI CLI を検出します。
3. 最初に検出された候補を実際の補完でテストします。失敗した場合は理由を表示し、次の使用可能な候補へ進みます。
4. 検出した候補をすべて試しても成功しない場合は、検出済みの候補を再試行するか、マスク表示されるプロンプトにプロバイダーの API キーを入力します。ガイド付きオンボーディングでは、推論が機能するまで Crestodian の使用や AI をスキップして終了する選択肢は提示されません。
5. 検証済みのモデルルートと、それに必要な認証情報または Plugin の状態のみを永続化します。ワークスペースと Gateway の設定は変更されません。
6. 検証済みのモデルで Crestodian を起動し、ワークスペース、Gateway、チャンネル、エージェント、Plugin、残りの任意設定を構成できるようにします。

構成済みのインストール環境でコマンドを再実行すると、現在のデフォルトモデルが最初にテストされるため、ガイド付きフローは検証と修復の手順として機能します。チェックに失敗しても、構成済みのモデルが自動的に置き換えられることはありません。オンボーディングは停止し、続行方法を尋ねます。推論以外の項目を後で追加するには `openclaw channels add` または `openclaw configure` を実行し、プロバイダーや認証ルートを変更するには `openclaw onboard` を使用します。

## 従来のウィザード：クイックスタートと詳細設定

完全版のウィザードを開くには、`openclaw onboard --classic` を実行します。最初に **クイックスタート**（デフォルト設定）と **詳細設定**（完全な制御）のいずれかを選択します。`--flow quickstart` または `--flow advanced`（別名 `manual`）を指定すると、従来のフローを選択し、このプロンプトをスキップできます。

<Tabs>
  <Tab title="クイックスタート（デフォルト）">
    - ローカル Gateway、ループバックバインド
    - デフォルトのワークスペース（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **トークン**（ループバックでも自動生成）
    - ツールポリシー：新規セットアップでは `tools.profile: "coding"`（既存の明示的なプロファイルは保持）
    - DM 分離：新規セットアップでは `session.dmScope: "per-channel-peer"`。詳細：[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram と WhatsApp の DM はデフォルトで **許可リスト**：Telegram では数値の Telegram ユーザー ID、WhatsApp では電話番号の入力を求めます

  </Tab>
  <Tab title="詳細設定（完全な制御）">
    - モード、ワークスペース、Gateway、チャンネル、デーモン、Skills のすべての手順を表示

  </Tab>
</Tabs>

リモートモード（`--mode remote`）では常に詳細設定フローを使用します。このマシンが別の場所にある Gateway に接続するよう設定するだけで、リモートホストには何もインストールせず、変更も加えません。

## 従来のオンボーディングで設定される内容

ローカルモード（デフォルト）では、次の手順を進めます：

1. **モデル／認証** - プロバイダーの認証フロー（API キー、OAuth、またはプロバイダー固有の手動認証）を選択します。カスタムプロバイダー（OpenAI 互換、OpenAI Responses 互換、Anthropic 互換、または自動検出の Unknown）も含まれます。デフォルトモデルを選択します。
   新規の OpenAI API キーセットアップではデフォルトが `openai/gpt-5.6`（修飾なしのダイレクト API ID は Sol に解決）になり、新規の ChatGPT/Codex セットアップではデフォルトが `openai/gpt-5.6-sol` になります。セットアップを再実行すると、`openai/gpt-5.5` を含む既存の明示的なモデルが保持されます。アカウントで GPT-5.6 が利用できない場合は、`openai/gpt-5.5` を明示的に選択してください。
   セキュリティ上の注意：このエージェントがツールを実行するか、Webhook／フックのコンテンツを処理する場合は、利用可能な最新世代の中で最も高性能なモデルを優先し、ツールポリシーを厳格に保ってください。性能が低い、または古い階層のモデルほど、プロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` により、API キーの平文値ではなく環境変数に基づく参照を保存します。参照先の環境変数はあらかじめ設定されている必要があり、設定されていない場合はオンボーディングが即座に失敗します。対話式のシークレット参照モードでは、環境変数または設定済みのプロバイダー参照（`file` または `exec`）を指定でき、保存前に簡易的な事前チェックが行われます。モデル／認証のセットアップ後、ウィザードでは任意のライブ補完テストを実行できます。失敗した場合はモデル／認証のセットアップに一度戻るか、従来のウィザードの残りをブロックせずに無視できます。無視しても Crestodian は利用可能になりません。対話式セットアップでは、引き続き推論チェックに合格する必要があります。
2. **ワークスペース** - エージェントファイル用のディレクトリ（デフォルトは `~/.openclaw/workspace`）。ブートストラップファイルを初期配置します。
3. **Gateway** - ポート、バインドアドレス、認証モード、Tailscale 公開。対話式トークンモードでは、平文でのトークン保存（デフォルト）を選択するか、SecretRef の使用を選択します。非対話式の SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
4. **チャンネル** - Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp など、組み込みおよび公式 Plugin のチャットチャンネル。
5. **デーモン** - LaunchAgent（macOS）、systemd ユーザーユニット（Linux/WSL2）、またはユーザー単位の Startup フォルダーへのフォールバックを備えたネイティブ Windows Scheduled Task をインストールします。
   トークン認証が必要で、`gateway.auth.token` が SecretRef で管理されている場合、デーモンのインストール時に検証は行われますが、解決されたトークンがスーパーバイザーサービスの環境メタデータに永続化されることはありません。未解決の SecretRef がある場合は、ガイダンスとともにインストールがブロックされます。`gateway.auth.mode` が未設定の状態で `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合、モードを明示的に設定するまでインストールはブロックされます。
6. **ヘルスチェック** - Gateway を起動し、到達可能であることを検証します。
7. **Skills** - 推奨される Skills と、その任意の依存関係をインストールします。

<Note>
オンボーディングを再実行しても、**Reset** を明示的に選択（または `--reset` を指定）しない限り、何も消去されません。CLI の `--reset` はデフォルトで設定、認証情報、セッションをリセットします。ワークスペースも削除するには `--reset-scope full` を使用してください。設定が無効、またはレガシーキーを含む場合、オンボーディングでは先に `openclaw doctor` を実行するよう求められます。
</Note>

`--flow import` は、新規セットアップの代わりに、検出された移行フロー（Hermes など）を従来のウィザードで実行します。[移行](/ja-JP/cli/migrate)および[インストール](/ja-JP/install/migrating-hermes)配下の移行ガイドを参照してください。`openclaw onboard --modern` は [Crestodian](/ja-JP/cli/crestodian) の互換エイリアスです。`openclaw crestodian` と同じ推論ゲートを使用します。推論が検証されるとアシスタントが起動し、対話式で失敗した場合はガイド付き推論セットアップに戻ります。

## 別のエージェントを追加する

`openclaw agents add <name>` を使用すると、独自のワークスペース、セッション、認証プロファイルを持つ別のエージェントを作成できます。`--workspace` を指定せずに実行すると、名前、ワークスペース、認証、チャンネル、バインディングを設定する対話式フローが開始されます。これは完全な `openclaw onboard` ウィザードではありません。

設定される項目：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意：

- デフォルトのワークスペース：`~/.openclaw/workspace-<agentId>`（`agents.defaults.workspace` が設定されている場合は、その配下）。
- 受信メッセージをこのエージェントにルーティングするには `bindings` を追加します（オンボーディングで設定することもできます）。
- 非対話式フラグ：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

手順ごとの詳細な動作と設定出力については、[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)を参照してください。
非対話式の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照してください。
すべてのフラグのリファレンスについては、[`openclaw onboard`](/ja-JP/cli/onboard)を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス：[`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディングの概要：[オンボーディングの概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング：[オンボーディング](/ja-JP/start/onboarding)
- エージェントの初回実行時の手順：[エージェントのブートストラップ](/ja-JP/start/bootstrapping)
