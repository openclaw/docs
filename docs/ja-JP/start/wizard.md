---
read_when:
    - CLI オンボーディングの実行または設定
    - 新しいマシンのセットアップ
sidebarTitle: 'Onboarding: CLI'
summary: CLI オンボーディング：推論を確認してから、残りのセットアップを OpenClaw に引き継ぐ
title: オンボーディング（CLI）
x-i18n:
    generated_at: "2026-07-16T12:08:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5c2ccc175ba96f19e46138e7baf251fdb70e5cfed2a6ea0803c1d635ffbc280c
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI オンボーディングは、macOS、Linux、および Windows（ネイティブまたは WSL2）で推奨されるターミナルセットアップ手順です。デフォルトでは、マシン上ですでに利用可能な AI アクセスを検出し、実際の補完で検証してから OpenClaw を起動し、ワークスペース、Gateway、オプション機能を設定します。`openclaw setup` は同じフローを実行します（[セットアップ](/ja-JP/cli/setup)では、設定のみを行う `--baseline` バリアントについて説明しています）。Windows デスクトップユーザーは、[Windows Hub](/ja-JP/platforms/windows)から開始することもできます。

ガイド付きオンボーディングでは、最初に推論を確立します。利用可能な AI アクセスを検出し、実際の補完を必須としたうえで、OpenClaw の残りの部分を設定するために [OpenClaw](/ja-JP/cli/openclaw) を開始します。**今はスキップ**を選択すると、OpenClaw を起動せずにオンボーディングを終了します。

カスタムプロバイダー、リモート Gateway のセットアップ、チャネルのペアリング、デーモン制御、スキル、インポートには、従来のウィザードを引き続き使用できます。`openclaw onboard --classic` で明示的に実行してください。ガイド付き推論選択ツールから従来のウィザードへ処理が委譲されることはありません。推論に合格すると、OpenClaw は `open channel wizard for
<channel>` を使用して、シークレットを必要とするチャネル設定を入力内容がマスクされるターミナルウィザードに引き渡せます。
モデルプロバイダーまたはその認証を変更するには、OpenClaw を終了して `openclaw onboard` を実行してください。OpenClaw からガイド付きまたは従来のプロバイダーフローが開かれることはありません。

<Info>
最短で最初のチャットを始めるには、ガイド付きセットアップを完了して `openclaw dashboard` を実行し、Control UI を通じてブラウザーでチャットします。ドキュメント：[ダッシュボード](/ja-JP/web/dashboard)。
</Info>

## ロケール

ウィザードでは、固定されたオンボーディング文言がローカライズされます。解決順序は、`OPENCLAW_LOCALE`、`LC_ALL`、`LC_MESSAGES`、`LANG`、最後に英語です。対応ロケール：`en`、`zh-CN`、`zh-TW`。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

製品名、コマンド、設定キー、URL、プロバイダー ID、モデル ID、Plugin／チャネルラベルは、ロケールに関係なく英語のままです。

推論以外の設定を後から再構成するには、次を実行します。

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用してください（[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照）。
</Note>

<Tip>
従来のウィザードには、プロバイダーを選択できるウェブ検索手順があります：Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG、Tavily。一部には API キーが必要ですが、キーなしで使用できるものもあります。後から `openclaw configure --section web` で設定できます。ドキュメント：
[ウェブツール](/ja-JP/tools/web)。
</Tip>

## ガイド付きのデフォルト

通常の `openclaw onboard` は、次の手順に従います。

1. セキュリティ通知に同意します。
2. 設定済みモデル、API キーの環境変数、対応するローカル AI CLI、および Gateway ホストから到達可能な Ollama または LM Studio サーバーにすでにインストールされているツール対応モデルを検出します。この読み取り専用の処理でモデルがダウンロードされることはありません。Gemini CLI と Antigravity のインストールは報告されますが、ツールを使用しないプローブを強制できないため、自動テストは行われません。
3. 最初に検出された候補を実際の補完でテストします。失敗した場合は理由を表示し、次の使用可能な候補へ進みます。
4. 検出候補を使い切った場合は、OpenAI、Anthropic、xAI（Grok）、Google、OpenRouter のいずれかを選択するか、残りのプロバイダーを表示するために **その他…** を選択します。各プロバイダーのリージョン、プラン、および対応するブラウザー、デバイス、API キー、トークン方式が2番目のメニューに表示され、同じ実際の補完でテストされます。OpenClaw を起動せずに終了するには、**今はスキップ**を選択します。
5. 検証済みのモデルルートと、それに必要な認証情報／Plugin の状態のみを永続化します。ワークスペースと Gateway の設定は変更されません。
6. 検証済みモデルで OpenClaw を起動し、ワークスペース、Gateway、チャネル、エージェント、Plugin、および残りのオプション設定を構成できるようにします。

設定済みの環境でコマンドを再実行すると、最初に現在のデフォルトモデルがテストされるため、ガイド付きフローは検証と修復の処理として機能します。チェックに失敗しても、設定済みモデルが自動的に置き換えられることはありません。オンボーディングは停止し、続行方法を確認します。推論以外の項目を後から追加するには `openclaw channels add` または `openclaw configure` を実行し、プロバイダーまたは認証ルートを変更するには `openclaw onboard` を使用します。

## 従来のウィザード：クイックスタートと詳細設定

完全なウィザードを開くには `openclaw onboard --classic` を実行します。最初に **クイックスタート**（デフォルト設定）と **詳細設定**（完全な制御）のどちらかを選択します。`--flow quickstart` または `--flow advanced`（別名 `manual`）を渡すと、従来のフローを選択してこの確認を省略できます。

<Tabs>
  <Tab title="クイックスタート（デフォルト）">
    - ローカル Gateway、ループバックバインド
    - デフォルトのワークスペース（または既存のワークスペース）
    - Gateway ポート **18789**
    - Gateway 認証 **トークン**（ループバックの場合も自動生成）
    - ツールポリシー：新規セットアップでは `tools.profile: "coding"`（既存の明示的なプロファイルは保持されます）
    - DM 分離：新規セットアップでは `session.dmScope: "per-channel-peer"`。詳細：[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 公開 **オフ**
    - Telegram と WhatsApp の DM はデフォルトで **許可リスト**を使用します。Telegram では数値の Telegram ユーザー ID、WhatsApp では電話番号の入力を求められます

  </Tab>
  <Tab title="詳細設定（完全な制御）">
    - モード、ワークスペース、Gateway、チャネル、デーモン、スキルのすべての手順を表示します

  </Tab>
</Tabs>

リモートモード（`--mode remote`）では常に詳細設定フローを使用します。このマシンから別の場所にある Gateway へ接続するための設定のみを行い、リモートホストへのインストールや変更は一切行いません。

## 従来のオンボーディングで設定される内容

ローカルモード（デフォルト）では、次の手順を進みます。

1. **モデル／認証** - API キー、OAuth、プロバイダー固有の手動認証など、プロバイダーの認証フローを選択します。カスタムプロバイダー（OpenAI 互換、OpenAI Responses 互換、Anthropic 互換、自動検出の不明）も選択できます。デフォルトモデルを選択します。
   新規の OpenAI API キーセットアップでは、デフォルトで `openai/gpt-5.6` が使用されます（修飾なしの直接 API ID は Sol に解決されます）。新規の ChatGPT／Codex セットアップでは、デフォルトで `openai/gpt-5.6-sol` が使用されます。セットアップを再実行すると、`openai/gpt-5.5` を含む既存の明示的なモデルが保持されます。アカウントで GPT-5.6 が公開されていない場合は、`openai/gpt-5.5` を明示的に選択してください。
   セキュリティ上の注意：このエージェントがツールを実行するか、Webhook／フックの内容を処理する場合は、利用可能な最新世代の中で最も強力なモデルを優先し、ツールポリシーを厳格に保ってください。性能が低い、または古いモデル階層ほど、プロンプトインジェクションを受けやすくなります。
   非対話実行では、`--secret-input-mode ref` はプレーンテキストの API キー値ではなく、環境変数を参照する参照情報を保存します。参照先の環境変数は事前に設定されている必要があり、設定されていなければオンボーディングは即座に失敗します。対話式のシークレット参照モードでは、環境変数または設定済みプロバイダー参照（`file` または `exec`）を指定でき、保存前に簡易事前チェックが行われます。モデル／認証のセットアップ後、ウィザードでは任意のライブ補完テストを実行できます。失敗した場合は、モデル／認証のセットアップに一度戻るか、失敗を無視して従来のウィザードの残りを続行できます。無視しても OpenClaw は利用可能になりません。対話セットアップには、引き続き推論チェックへの合格が必要です。
2. **ワークスペース** - エージェントファイル用のディレクトリ（デフォルトは `~/.openclaw/workspace`）。ブートストラップファイルを初期配置します。
3. **Gateway** - ポート、バインドアドレス、認証モード、Tailscale 公開。対話式トークンモードでは、プレーンテキストでのトークン保存（デフォルト）を選択するか、SecretRef の使用を選択します。非対話式 SecretRef のパス：`--gateway-token-ref-env <ENV_VAR>`。
4. **チャネル** - Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp などの組み込みおよび公式 Plugin のチャットチャネル。
5. **デーモン** - LaunchAgent（macOS）、systemd ユーザーユニット（Linux／WSL2）、またはユーザー単位のスタートアップフォルダーへのフォールバックを備えたネイティブ Windows タスクスケジューラタスクをインストールします。
   トークン認証が必要で、`gateway.auth.token` が SecretRef で管理されている場合、デーモンのインストールではその参照を検証しますが、解決されたトークンをスーパーバイザーサービスの環境メタデータに永続化しません。解決できない SecretRef があると、ガイダンスを表示してインストールを阻止します。`gateway.auth.mode` が未設定の状態で `gateway.auth.token` と `gateway.auth.password` の両方が設定されている場合、モードを明示的に設定するまでインストールは阻止されます。
6. **ヘルスチェック** - Gateway を起動し、到達可能であることを検証します。
7. **Skills** - 推奨されるスキルと、そのオプション依存関係をインストールします。

<Note>
オンボーディングを再実行しても、**リセット**を明示的に選択する（または `--reset` を渡す）まで、何も消去されません。CLI の `--reset` は、デフォルトで設定、認証情報、セッションを対象とします。ワークスペースも削除するには `--reset-scope full` を使用してください。設定が無効であるか、レガシーキーを含んでいる場合は、最初に `openclaw doctor` を実行するようオンボーディングで求められます。
</Note>

`--flow import` は、新規セットアップの代わりに、検出された移行フロー（Hermes など）を従来のウィザードで実行します。[移行](/ja-JP/cli/migrate)および[インストール](/ja-JP/install/migrating-hermes)配下の移行ガイドを参照してください。`openclaw onboard --modern` は [OpenClaw](/ja-JP/cli/openclaw) の互換性エイリアスです。`openclaw setup` と同じ推論ゲートを使用します。推論が検証されるとアシスタントが起動し、対話式の検証に失敗するとガイド付き推論セットアップに戻ります。

## 別のエージェントを追加する

独自のワークスペース、セッション、認証プロファイルを持つ個別のエージェントを作成するには、`openclaw agents add <name>` を使用します。`--workspace` なしで実行すると、名前、ワークスペース、認証、チャネル、バインディングを設定する対話式フローが開始されます。これは完全な `openclaw onboard` ウィザードではありません。

設定される内容：

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意：

- デフォルトのワークスペース：`~/.openclaw/workspace-<agentId>`（`agents.defaults.workspace` が設定されている場合はその配下）。
- 受信メッセージをこのエージェントへルーティングするには、`bindings` を追加します（オンボーディングで設定することもできます）。
- 非対話式フラグ：`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 完全なリファレンス

手順ごとの詳しい動作と設定出力については、[CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)を参照してください。
非対話式の例については、[CLI 自動化](/ja-JP/start/wizard-cli-automation)を参照してください。
すべてのフラグについては、[`openclaw onboard`](/ja-JP/cli/onboard)を参照してください。

## 関連ドキュメント

- CLI コマンドリファレンス：[`openclaw onboard`](/ja-JP/cli/onboard)
- オンボーディングの概要：[オンボーディングの概要](/ja-JP/start/onboarding-overview)
- macOS アプリのオンボーディング：[オンボーディング](/ja-JP/start/onboarding)
- エージェントの初回実行手順：[エージェントのブートストラップ](/ja-JP/start/bootstrapping)
