---
read_when:
    - 推論環境を確立してから、Crestodian でセットアップを完了する場合です
summary: '`openclaw onboard`（対話式オンボーディング）の CLI リファレンス'
title: オンボーディング
x-i18n:
    generated_at: "2026-07-12T14:23:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

まず推論を確立するガイド付きセットアップです。既存の AI アクセスを検出し、
実際の補完を必須とし、動作する経路のみを永続化してから、残りを設定するために
Crestodian を起動します。`openclaw setup` も同じエントリポイントです。
`openclaw setup --baseline` はベースラインの設定とワークスペースのみを書き込みます。

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローの手順を説明します。
  </Card>
  <Card title="オンボーディングの概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体の仕組みを説明します。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部動作、各ステップの挙動を説明します。
  </Card>
  <Card title="CLI 自動化" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非対話型フラグとスクリプトによるセットアップを説明します。
  </Card>
  <Card title="macOS アプリのオンボーディング" href="/ja-JP/start/onboarding" icon="apple">
    macOS メニューバーアプリのオンボーディングフローを説明します。
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

- `--classic`: 完全なステップ形式のウィザードを開きます。
  `--non-interactive` と組み合わせることはできません。自動セットアップでは
  `--classic` を省略してください。
- `--flow quickstart`: 最小限のプロンプトで従来のウィザードを開き、
  Gateway トークンを自動生成します。
- `--flow manual`（別名 `advanced`）: ポート、バインド、認証に関するすべての
  プロンプトを含む従来のウィザードを開きます。
- `--flow import`: 検出された移行プロバイダー（たとえば `--import-from hermes` による Hermes）を実行し、計画をプレビューして、確認後に適用します。インポートは新規の OpenClaw セットアップに対してのみ実行されます。設定、認証情報、セッション、ワークスペースの状態が存在する場合は、まずそれらをリセットしてください。ドライラン計画、上書きモード、レポート、正確なマッピングについては、[`openclaw migrate`](/ja-JP/cli/migrate) を使用してください。
- `--modern` は、Crestodian の対話型セットアップアシスタント用の互換性エイリアスです。
  `openclaw crestodian` と同じ実推論ゲートを使用し、
  `--workspace`、`--accept-risk`、`--non-interactive`、`--json` のみを
  受け付けます。その他のセットアップフラグは黙って無視されず、拒否されます。

## ガイド付きフロー

引数なしの `openclaw onboard` はガイド付きフローを開始します。セキュリティ通知を
表示し、設定済みモデル、API キーの環境変数、サポートされているローカル CLI を通じて
すでに利用可能な AI アクセスを検出してから、実際の補完によって推奨候補をテストします。
その候補が失敗した場合、オンボーディングは理由を表示し、次に使用可能な候補を自動的に
試します。

自動検出の候補をすべて試しても成功しなかった場合は、検出された別の候補を選択するか、
マスクされたプロンプトにプロバイダーの API キーを入力します。手動で入力したキーも、
同じ実補完経路でテストされます。候補が合格するまで、ガイド付きオンボーディングでは
Crestodian の起動や AI をスキップして終了する選択肢は提供されません。テストが成功すると、
OpenClaw は検証済みのモデル経路とその認証情報のみを永続化します。失敗した候補によって
設定済みモデルが置き換えられたり、試行した認証情報が保存されたりすることはありません。
ワークスペースと Gateway のセットアップは、Crestodian が起動するまで変更されません。

ガイド付きモードでは、`--workspace <dir>` により Crestodian に提案するワークスペースと、
分離された推論コンテキストを指定します。Crestodian のセットアップ提案を承認するまで、
これは永続化されません。従来のオンボーディングと非対話型オンボーディングでは、それぞれの
通常のセットアップフローを通じてワークスペースが永続化されます。

推論チェックが完了すると、ガイド付きオンボーディングは検証済みモデルで Crestodian を直ちに起動します。その後、Crestodian でワークスペース、Gateway、チャンネル、エージェント、Plugin、その他のオプション機能を設定できます。Crestodian 内では、`open channel wizard for <channel>` を使用して、チャンネル認証情報の収集を入力がマスクされたターミナルウィザードに委ねます。モデルプロバイダーまたはその認証を変更するには、Crestodian を終了して `openclaw onboard` を実行してください。Crestodian からガイド付きまたはクラシックのプロバイダーフローを開くことはできません。

設定済みのインストール環境で `openclaw onboard` を再度実行すると、最初に現在の
デフォルトモデルが検証されるため、同じフローが検証と修復の処理として機能します。
このチェックに失敗しても、設定済みモデルが自動的に置き換えられることはありません —
オンボーディングは停止し、続行方法を確認します。このチェックは
ワークスペースの外部で実行されるため、ワークスペース Plugin が提供するモデルは、エージェントでは
動作していても、ここでは失敗する可能性があります。
プロバイダー固有の認証、チャンネル、Skills、リモート Gateway のセットアップ、インポート、または
Gateway の完全な制御には、`openclaw onboard --classic` を使用してください。対話形式での
推論を伴わないセットアップと修復には、`openclaw crestodian` を実行してください。`openclaw onboard
--modern` は、同じ推論ゲートを通る互換性エイリアスです。従来の
ウィザードでは、必要に応じてライブ補完によってデフォルトモデルを検証できますが、
Crestodian は独自のライブ推論チェックに合格するまで起動しません。

対話型ターミナルでは、サブコマンドなしの単独の `openclaw` は、設定状態に応じて処理先が決まります。

- アクティブな設定ファイルが存在しないか、ユーザーが作成した設定がない（空またはメタデータのみの）場合、ガイド付きオンボーディングが開始されます。
- 設定ファイルは存在するものの検証に失敗した場合、`openclaw doctor` の案内を伴う従来のオンボーディング経路が開始されます。Crestodian には動作する推論が必要なため、この推論前の状態の修復には使用されません。
- 設定ファイルが有効な場合、通常のエージェント TUI が開きます。設定済みで到達可能な Gateway にエージェントとモデルがある場合、オンボーディングや Crestodian を経由せず、その UI に直接移動します。設定済みのインストール環境で Crestodian にアクセスするには、TUI 内で `/crestodian` を使用するか、`openclaw crestodian` を実行します。

平文の `ws://` は、ループバック、プライベート IP リテラル、`.local`、および Tailnet の `*.ts.net` Gateway URL で使用できます。それ以外の信頼できるプライベート DNS 名を使用する場合は、オンボーディングプロセスの環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。

## リセット

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` は、セットアップを実行する前に状態を消去します。`--reset-scope` は消去する範囲を制御します。指定できる値は、`config`（設定のみ）、`config+creds+sessions`（スコープを指定せずに `--reset` を渡した場合のデフォルト）、`full`（ワークスペースもリセット）です。ワークスペースのリセットは、`--reset-scope full` を指定した場合にのみ実行されます。

## ロケール

対話型オンボーディングでは、セットアップ用の定型文に CLI ウィザードのロケールが使用されます。解決順序は次のとおりです。

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語へのフォールバック

サポートされているウィザードのロケールは `en`、`zh-CN`、`zh-TW` です。ロケール値には、`zh_CN.UTF-8` のようなアンダースコア形式や POSIX サフィックス形式も使用できます。製品名、コマンド名、設定キー、URL、プロバイダー ID、モデル ID、Plugin／チャンネルのラベルはそのまま維持されます。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非対話型セットアップ

`--non-interactive` には `--accept-risk` が必要です（エージェントは強力であり、システムへの完全なアクセスにはリスクがあることを了承します）。`--mode` のデフォルトは `local` です。

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

`--custom-api-key` は省略可能です。省略した場合、オンボーディングは環境内の `CUSTOM_API_KEY` を確認します。OpenClaw は、一般的なビジョンモデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral など）を画像対応として自動的に認識します。未知のカスタムビジョン ID には `--custom-image-input` を渡し、テキスト専用のメタデータを強制するには `--custom-text-input` を使用します。`/v1/responses` をサポートしているが `/v1/chat/completions` はサポートしていない OpenAI 互換エンドポイントには、`--custom-compatibility openai-responses` を使用します。有効な値は `openai`（デフォルト）、`openai-responses`、`anthropic` です。

LM Studio には、プロバイダー固有のキーフラグもあります。

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非対話型の Ollama：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は省略可能です。省略した場合、オンボーディングは Ollama が推奨するデフォルトを使用します。`kimi-k2.5:cloud` のようなクラウドモデル ID もここで使用できます。

プロバイダーキーをプレーンテキストではなく参照として保存します。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を指定すると、オンボーディングはプレーンテキストのキー値ではなく、環境変数を基にした参照を書き込みます。認証プロファイルを使用するプロバイダーでは `keyRef: { source: "env", provider: "default", id: <envVar> }` を書き込み、カスタムプロバイダーでは同じ方法で `models.providers.<id>.apiKey` を書き込みます（例：`{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約：オンボーディングプロセスの環境にプロバイダーの環境変数（例：`OPENAI_API_KEY`）を設定してください。その環境変数が設定されていない限り、インラインのキーフラグを同時に渡さないでください。対応する環境変数なしでフラグ値を指定すると、ガイダンスを表示して即座に失敗します。

### Gateway 認証（非対話型）

- `--gateway-auth token --gateway-token <token>` はプレーンテキストのトークンを保存します。`token` がデフォルトの認証モードです。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を環境変数の SecretRef として保存します。オンボーディングプロセスの環境に、その名前の空でない環境変数が必要です。
- `--gateway-token` と `--gateway-token-ref-env` は同時に使用できません。
- `--install-daemon` を指定した場合：SecretRef で管理される `gateway.auth.token` は検証されますが、解決済みのプレーンテキストとしてスーパーバイザーサービスの環境メタデータには永続化されません。参照を解決できない場合、インストールは修正方法のガイダンスを表示して安全側に失敗します。`gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合は、モードが明示的に設定されるまでインストールをブロックします。
- ローカルオンボーディングは、設定に `gateway.mode="local"` を書き込みます。その後の設定ファイルに `gateway.mode` がない場合、それは有効なローカルモードのショートカットではなく、設定の破損または不完全な手動編集を示します。
- ローカルオンボーディングは、選択したセットアップパスで必要となるダウンロード可能なPluginをインストールします（たとえば、それらの認証方法に対応する Codex または Copilot ランタイムPlugin）。リモートオンボーディングはリモート Gateway の接続情報のみを書き込み、ローカルのPluginパッケージをインストールすることはありません。
- `--allow-unconfigured` は独立した `openclaw gateway run` の緊急回避手段です。オンボーディングで `gateway.mode` を省略できるようにするものではありません。

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

### ローカル Gateway の健全性

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を待機してから正常終了します。
- `--install-daemon` は、最初に管理対象の Gateway インストールパスを開始します。これを指定しない場合、ローカル Gateway がすでに実行されている必要があります（例：`openclaw gateway run`）。
- 自動化で設定／ワークスペース／ブートストラップの書き込みのみを行いたい場合、`--skip-health` は待機をスキップします。
- `--skip-bootstrap` は `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` は最初に Scheduled Tasks を試し、タスクの作成が拒否された場合は、ユーザーごとの Startup フォルダーにあるログイン項目へフォールバックします。

### 対話型参照モード

- プロンプトが表示されたら **シークレット参照を使用** を選択し、次に **Environment variable** または設定済みのシークレットプロバイダー（`file` または `exec`）を選択します。
- オンボーディングは参照を保存する前に高速な事前検証を実行し、失敗した場合は再試行できます。

### Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントとモデルを自動検出します。Coding Plan エンドポイントでは `zai/glm-5.2` が優先されます（利用できない場合は `glm-5.1` にフォールバック）。一般 API エンドポイントのデフォルトは `zai/glm-5.1` です。Coding Plan エンドポイントを強制するには、`zai-coding-global` または `zai-coding-cn` を直接選択してください。
</Note>

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# その他の Z.AI エンドポイントの選択肢: zai-coding-cn、zai-global、zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 非対話型の追加フラグ

トークンベースのモデル認証（`--auth-choice token` とともに使用）:

| フラグ                          | 説明                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | トークンを発行するトークンプロバイダー ID                                                                                   |
| `--token <token>`               | モデル認証用のトークン値                                                                                                    |
| `--token-profile-id <id>`       | 認証プロファイル ID（デフォルトは `<provider>:manual`。一部のプロバイダー所有フローでは、`anthropic:default` など独自のデフォルトを使用） |
| `--token-expires-in <duration>` | オプションのトークン有効期限（例: `365d`、`12h`）                                                                           |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

デーモンのインストール制御: `--no-install-daemon` / `--skip-daemon`（エイリアス。Gateway サービスのインストールをスキップ）、`--daemon-runtime <node|bun>`。

Skills: `--node-manager <npm|pnpm|bun>`（デフォルトは `npm`）、`--skip-skills`。

UI とフックのセットアップ: `--skip-ui`（Control UI/TUI のプロンプトをスキップ）、`--skip-hooks`（Webhook/フックのセットアップをスキップ）、`--skip-channels`、`--skip-search`。

出力: `--suppress-gateway-token-output` は、トークンを含む Gateway/UI 出力（トークンのヒント、トークンが埋め込まれた自動ログイン URL、Control UI の自動起動）を抑制します。共有ターミナルや CI で便利です。

<Note>
ガイド付きまたはクラシックのオンボーディングでは、`--json` を指定しても非対話モードにはなりません。
`--modern` とともに使用すると、JSON は Crestodian の概要を一度だけ出力し、その
単一の結果の後に終了します。その他のスクリプトでは `--non-interactive` を使用してください。
</Note>

## プロバイダーの事前フィルタリング

認証方法の選択によって優先プロバイダーが決まる場合、オンボーディングはデフォルトモデルと許可リストの選択画面を、そのプロバイダーのモデルに事前フィルタリングします。このフィルターは、同じ Plugin が所有する他のプロバイダーにも一致するため、`volcengine`/`volcengine-plan` や `byteplus`/`byteplus-plan` などの Coding Plan バリエーションも対象になります。優先プロバイダーのフィルターで読み込み済みモデルが見つからない場合、選択画面を空のままにせず、フィルタリングされていないカタログにフォールバックします。

## Web 検索の追加設定

一部の Web 検索プロバイダーでは、オンボーディング中にプロバイダー固有の追加プロンプトが表示されます。

- **Grok** では、同じ xAI 認証と `x_search` モデルの選択を使用して、オプションの `x_search` セットアップを提示できます。
- **Kimi** では、Moonshot API のリージョン（`api.moonshot.ai` または `api.moonshot.cn`）とデフォルトの Kimi Web 検索モデルの入力を求めることがあります。

## その他の動作

- ローカルオンボーディングの DM スコープの動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速で最初のチャットを開始する方法: `openclaw dashboard`（Control UI、チャンネル設定なし）。
- カスタムプロバイダー: 一覧にないホスト型プロバイダーを含め、OpenAI または Anthropic 互換の任意のエンドポイントに接続できます。ライブプローブによる自動検出には、**Unknown** 互換性を使用します。
- Hermes の状態が検出された場合、オンボーディングでは移行フローが提示されます（上記の `--flow import` を参照）。

## よく使う後続コマンド

推論を伴わない対象限定の変更には、後から `openclaw configure` を使用し、チャンネルのみのセットアップには `openclaw
channels add` を使用します。モデルプロバイダーまたは認証ルートを変更する場合は、
代わりに `openclaw onboard` を実行してください。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
