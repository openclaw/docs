---
read_when:
    - 推論環境を確立してから、Crestodian でセットアップを完了する場合
summary: '`openclaw onboard`（対話形式のオンボーディング）の CLI リファレンス'
title: オンボーディング
x-i18n:
    generated_at: "2026-07-11T22:07:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

最初に推論を確立するガイド付きセットアップです。既存の AI アクセスを検出し、実際の補完の成功を必須とし、動作する経路のみを永続化してから、残りを構成するために Crestodian を起動します。`openclaw setup` も同じエントリーポイントです。`openclaw setup --baseline` はベースラインの構成とワークスペースのみを書き込みます。

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローの手順です。
  </Card>
  <Card title="オンボーディングの概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体の連携方法です。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部動作、各ステップの挙動です。
  </Card>
  <Card title="CLI 自動化" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非対話型フラグとスクリプトによるセットアップです。
  </Card>
  <Card title="macOS アプリのオンボーディング" href="/ja-JP/start/onboarding" icon="apple">
    macOS メニューバーアプリのオンボーディングフローです。
  </Card>
</CardGroup>

## 例

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: 完全なステップ形式のウィザードを開きます。`--non-interactive` とは併用できません。自動セットアップでは `--classic` を省略してください。
- `--flow quickstart`: 最小限のプロンプトで従来のウィザードを開き、Gateway トークンを自動生成します。
- `--flow manual`（別名 `advanced`）: ポート、バインド、認証に関するすべてのプロンプトを含む従来のウィザードを開きます。
- `--flow import`: 検出された移行プロバイダー（たとえば `--import-from hermes` による Hermes）を実行し、計画をプレビューしてから、確認後に適用します。インポートは新規の OpenClaw セットアップに対してのみ実行されます。構成、認証情報、セッション、ワークスペースの状態が存在する場合は、先にリセットしてください。ドライラン計画、上書きモード、レポート、正確なマッピングについては、[`openclaw migrate`](/ja-JP/cli/migrate) を使用してください。
- `--modern` は Crestodian の対話型セットアップアシスタント用の互換エイリアスです。`openclaw crestodian` と同じ実推論ゲートを使用し、`--workspace`、`--accept-risk`、`--non-interactive`、`--json` のみを受け付けます。その他のセットアップフラグは暗黙に無視されず、拒否されます。

## ガイド付きフロー

通常の `openclaw onboard` はガイド付きフローを開始します。セキュリティに関する注意事項を表示し、構成済みモデル、API キー環境変数、サポート対象のローカル CLI を通じてすでに利用可能な AI アクセスを検出してから、推奨候補を実際の補完でテストします。その候補が失敗した場合、オンボーディングは理由を表示し、次に利用可能な候補を自動的に試します。

自動検出ですべての候補を試しても成功しない場合は、検出された別の候補を選択するか、マスクされたプロンプトでプロバイダーの API キーを入力します。手動で入力したキーも同じ実補完経路でテストされます。候補が成功するまで、ガイド付きオンボーディングでは Crestodian の起動や AI をスキップして終了する選択肢は提供されません。OpenClaw はテストの成功後に、検証済みのモデル経路とその認証情報のみを永続化します。失敗した候補によって構成済みモデルが置き換えられたり、試行した認証情報が保存されたりすることはありません。ワークスペースと Gateway のセットアップは、Crestodian が起動するまで変更されません。

ガイド付きモードでは、`--workspace <dir>` によって Crestodian が提案するワークスペースと分離された推論コンテキストを指定します。Crestodian のセットアップ提案を承認するまで永続化されません。従来のオンボーディングと非対話型オンボーディングでは、それぞれ通常のセットアップフローを通じてワークスペースを永続化します。

推論が成功すると、ガイド付きオンボーディングは検証済みモデルを使用して Crestodian を直ちに起動します。その後、Crestodian でワークスペース、Gateway、チャンネル、エージェント、Plugin、その他の任意機能を構成できます。Crestodian 内で `open channel wizard for <channel>` を使用すると、チャンネルの認証情報の収集をマスクされたターミナルウィザードに委ねられます。モデルプロバイダーまたはその認証方式を変更するには、Crestodian を終了して `openclaw onboard` を実行します。Crestodian からガイド付きまたは従来のプロバイダーフローを開くことはできません。

構成済みのインストール環境で `openclaw onboard` を再度実行すると、最初に現在のデフォルトモデルを検証するため、同じフローが検証と修復の処理として機能します。この確認が失敗しても、構成済みモデルが自動的に置き換えられることはありません。オンボーディングは停止し、続行方法を尋ねます。この確認はワークスペースの外部で実行されるため、ワークスペースの Plugin が提供するモデルは、エージェント内では動作していても、ここでは失敗する場合があります。
プロバイダー固有の認証、チャンネル、Skills、リモート Gateway のセットアップ、インポート、または Gateway の完全な制御には、`openclaw onboard --classic` を使用してください。推論以外の対話型セットアップと修復には `openclaw crestodian` を実行してください。`openclaw onboard --modern` は同じ推論ゲートを経由する互換エイリアスです。従来のウィザードでは、必要に応じて実際の補完によってデフォルトモデルを検証できますが、Crestodian 自身の実推論確認が成功するまで Crestodian は起動しません。

対話型ターミナルでは、サブコマンドなしの `openclaw` は構成の状態に応じて処理を振り分けます。

- アクティブな構成ファイルが存在しないか、ユーザーが記述した設定がない場合（空またはメタデータのみ）、ガイド付きオンボーディングを開始します。
- 構成ファイルは存在するものの検証に失敗した場合、`openclaw doctor` の案内とともに従来のオンボーディング経路を開始します。Crestodian には動作する推論が必要なため、推論確立前のこの状態の修復には使用されません。
- 構成ファイルが有効な場合、通常のエージェント TUI を開きます。エージェントとモデルが構成された到達可能な Gateway があれば、オンボーディングや Crestodian を経由せず、その UI に直接移動します。構成済みのインストール環境では、TUI 内の `/crestodian` または `openclaw crestodian` で Crestodian を起動できます。

平文の `ws://` は、ループバック、プライベート IP リテラル、`.local`、および Tailnet の `*.ts.net` Gateway URL で使用できます。その他の信頼済みプライベート DNS 名では、オンボーディングプロセスの環境に `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

## リセット

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` はセットアップの実行前に状態を消去します。`--reset-scope` は消去範囲を制御します。`config`（構成のみ）、`config+creds+sessions`（スコープなしで `--reset` を指定した場合のデフォルト）、または `full`（ワークスペースもリセット）を指定できます。ワークスペースのリセットは `--reset-scope full` の場合にのみ実行されます。

## ロケール

対話型オンボーディングでは、固定されたセットアップ文言に CLI ウィザードのロケールを使用します。解決順序は次のとおりです。

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語へのフォールバック

サポートされているウィザードのロケールは `en`、`zh-CN`、`zh-TW` です。ロケール値には、`zh_CN.UTF-8` のようなアンダースコア形式や POSIX サフィックス形式も使用できます。製品名、コマンド名、構成キー、URL、プロバイダー ID、モデル ID、Plugin やチャンネルのラベルはそのまま維持されます。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非対話型セットアップ

`--non-interactive` には `--accept-risk` が必要です（エージェントは強力であり、システム全体へのアクセスにはリスクがあることを了承します）。`--mode` のデフォルトは `local` です。

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` は任意です。省略した場合、オンボーディングは環境内の `CUSTOM_API_KEY` を確認します。OpenClaw は一般的なビジョンモデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral など）を画像対応として自動的にマークします。未知のカスタムビジョン ID には `--custom-image-input` を渡し、テキスト専用のメタデータを強制するには `--custom-text-input` を使用します。`/v1/responses` をサポートする一方で `/v1/chat/completions` をサポートしない OpenAI 互換エンドポイントには、`--custom-compatibility openai-responses` を使用します。有効な値は `openai`（デフォルト）、`openai-responses`、`anthropic` です。

LM Studio にはプロバイダー固有のキーフラグもあります。

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非対話型の Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` などのクラウドモデル ID もここで使用できます。

プロバイダーキーを平文ではなく参照として保存するには、次のようにします。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使用すると、オンボーディングは平文のキー値ではなく環境変数に基づく参照を書き込みます。認証プロファイルに基づくプロバイダーでは `keyRef: { source: "env", provider: "default", id: <envVar> }` を書き込み、カスタムプロバイダーでは `models.providers.<id>.apiKey` を同様に書き込みます（たとえば `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約として、オンボーディングプロセスの環境にプロバイダーの環境変数（たとえば `OPENAI_API_KEY`）を設定してください。その環境変数が設定されていない限り、インラインのキーフラグを同時に渡さないでください。対応する環境変数なしでフラグ値を指定すると、案内を表示して即座に失敗します。

### Gateway 認証（非対話型）

- `--gateway-auth token --gateway-token <token>` は平文のトークンを保存します。`token` はデフォルトの認証モードです。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を環境変数の SecretRef として保存します。オンボーディングプロセスの環境に、その名前の空でない環境変数が必要です。
- `--gateway-token` と `--gateway-token-ref-env` は同時に指定できません。
- `--install-daemon` を使用する場合、SecretRef で管理される `gateway.auth.token` は検証されますが、解決済みの平文としてスーパーバイザーサービスの環境メタデータに永続化されません。参照を解決できない場合、インストールは修復案内を表示して安全側に失敗します。`gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- ローカルオンボーディングは構成に `gateway.mode="local"` を書き込みます。後から構成ファイルに `gateway.mode` が存在しない場合は、構成の破損または不完全な手動編集を意味し、有効なローカルモードの省略指定ではありません。
- ローカルオンボーディングは、選択したセットアップ経路に必要なダウンロード可能な Plugin をインストールします（たとえば、それらの認証方式用の Codex または Copilot ランタイム Plugin）。リモートオンボーディングはリモート Gateway の接続情報のみを書き込み、ローカルの Plugin パッケージをインストールすることはありません。
- `--allow-unconfigured` は別個の `openclaw gateway run` 用エスケープハッチです。オンボーディングで `gateway.mode` を省略できるようにするものではありません。

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### ローカル Gateway の正常性

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を待ってから正常終了します。
- `--install-daemon` は、最初に管理対象 Gateway のインストール経路を開始します。指定しない場合は、ローカル Gateway がすでに実行されている必要があります（たとえば `openclaw gateway run`）。
- 自動化で構成、ワークスペース、ブートストラップの書き込みのみを行う場合、`--skip-health` で待機を省略できます。
- `--skip-bootstrap` は `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成を省略します。
- ネイティブ Windows では、`--install-daemon` は最初に Scheduled Tasks を試し、タスクの作成が拒否された場合はユーザー単位の Startup フォルダーのログイン項目にフォールバックします。

### 対話型参照モード

- プロンプトが表示されたら **シークレット参照を使用** を選択し、続いて **環境変数** または構成済みのシークレットプロバイダー（`file` または `exec`）を選択します。
- オンボーディングは参照を保存する前に高速な事前検証を実行し、失敗した場合は再試行できます。

### Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントとモデルを自動検出します。Coding Plan エンドポイントでは `zai/glm-5.2` を優先し（利用できない場合は `glm-5.1` にフォールバック）、一般 API エンドポイントではデフォルトで `zai/glm-5.1` を使用します。Coding Plan エンドポイントを強制するには、`zai-coding-global` または `zai-coding-cn` を直接選択してください。
</Note>

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# その他の Z.AI エンドポイントの選択肢: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## その他の非対話型フラグ

トークンベースのモデル認証（`--auth-choice token` とともに使用）:

| フラグ                          | 説明                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | トークンを発行するトークンプロバイダー ID                                                                                          |
| `--token <token>`               | モデル認証用のトークン値                                                                                                           |
| `--token-profile-id <id>`       | 認証プロファイル ID（デフォルトは `<provider>:manual`。一部のプロバイダー所有フローでは `anthropic:default` など独自のデフォルトを使用） |
| `--token-expires-in <duration>` | 任意のトークン有効期間（例: `365d`、`12h`）                                                                                        |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

デーモンのインストール制御: `--no-install-daemon` / `--skip-daemon`（エイリアス。Gateway サービスのインストールをスキップ）、`--daemon-runtime <node|bun>`。

Skills: `--node-manager <npm|pnpm|bun>`（デフォルトは `npm`）、`--skip-skills`。

UI とフックのセットアップ: `--skip-ui`（Control UI/TUI のプロンプトをスキップ）、`--skip-hooks`（Webhook/フックのセットアップをスキップ）、`--skip-channels`、`--skip-search`。

出力: `--suppress-gateway-token-output` は、トークンを含む Gateway/UI 出力（トークンのヒント、トークンが埋め込まれた自動ログイン URL、Control UI の自動起動）を抑制します。共有端末や CI で役立ちます。

<Note>
`--json` は、ガイド付きまたはクラシックのオンボーディングで非対話型モードを意味しません。
`--modern` とともに使用すると、JSON は Crestodian の概要を一度だけ表示し、その
単一の結果の後に終了します。その他のスクリプトでは `--non-interactive` を使用してください。
</Note>

## プロバイダーの事前フィルタリング

認証方式の選択によって優先プロバイダーが決まる場合、オンボーディングはデフォルトモデルと許可リストの選択画面を、そのプロバイダーのモデルに事前フィルタリングします。このフィルターは、同じ Plugin が所有する他のプロバイダーにも一致するため、`volcengine`/`volcengine-plan` や `byteplus`/`byteplus-plan` などの Coding Plan バリアントにも対応します。優先プロバイダーのフィルターで読み込み済みモデルが見つからない場合、選択画面を空のままにせず、フィルターされていないカタログにフォールバックします。

## Web 検索の追加質問

一部の Web 検索プロバイダーでは、オンボーディング中にプロバイダー固有の追加プロンプトが表示されます。

- **Grok** では、同じ xAI 認証と `x_search` モデルの選択を使用して、任意の `x_search` セットアップを提案できます。
- **Kimi** では、Moonshot API のリージョン（`api.moonshot.ai` または `api.moonshot.cn`）と、デフォルトの Kimi Web 検索モデルを確認する場合があります。

## その他の動作

- ローカルオンボーディングでの DM スコープの動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速で最初のチャットを開始する方法: `openclaw dashboard`（Control UI、チャンネル設定不要）。
- カスタムプロバイダー: 一覧にないホスト型プロバイダーを含め、OpenAI または Anthropic 互換の任意のエンドポイントに接続できます。ライブプローブで自動検出するには、互換性として **不明** を使用します。
- Hermes の状態が検出された場合、オンボーディングは移行フローを提示します（上記の `--flow import` を参照）。

## よく使う後続コマンド

推論を伴わない対象限定の変更には、後で `openclaw configure` を使用し、チャンネルのみのセットアップには `openclaw
channels add` を使用します。モデルプロバイダーまたは認証ルートを変更する場合は、
代わりに `openclaw onboard` を実行してください。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
