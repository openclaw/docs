---
read_when:
    - 推論を確立してから、Crestodian でセットアップを完了します
summary: '`openclaw onboard`（対話型オンボーディング）の CLI リファレンス'
title: オンボーディング
x-i18n:
    generated_at: "2026-07-14T13:37:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 4b305789c1ee53237acaabb94b243f54771bea5a476584dc3e71df8b053bbb24
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

まず推論を確立するガイド付きセットアップです。既存の AI アクセスを検出し、
実際の補完を必須とし、動作するルートのみを永続化してから、
残りを構成するために Crestodian を起動します。`openclaw setup` は同じエントリーポイントです。
`openclaw setup --baseline` はベースラインの構成とワークスペースのみを書き込みます。

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローの手順説明。
  </Card>
  <Card title="オンボーディングの概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体の仕組み。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部動作、各ステップの挙動。
  </Card>
  <Card title="CLI 自動化" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非対話型フラグとスクリプトによるセットアップ。
  </Card>
  <Card title="macOS アプリのオンボーディング" href="/ja-JP/start/onboarding" icon="apple">
    macOS メニューバーアプリのオンボーディングフロー。
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
  `--non-interactive` とは併用できません。自動セットアップでは `--classic` を省略します。
- `--flow quickstart`: 最小限のプロンプトでクラシックウィザードを開き、
  Gateway トークンを自動生成します。
- `--flow manual`（別名 `advanced`）: ポート、バインド、認証に関するすべてのプロンプトを含む
  クラシックウィザードを開きます。
- `--flow import`: 検出された移行プロバイダー（たとえば `--import-from hermes` 経由の Hermes）を実行し、計画をプレビューして、確認後に適用します。インポートは新規の OpenClaw セットアップに対してのみ実行されます。構成、認証情報、セッション、ワークスペースの状態が存在する場合は、先にそれらをリセットしてください。ドライラン計画、上書きモード、レポート、正確なマッピングについては、[`openclaw migrate`](/ja-JP/cli/migrate) を使用してください。
- `--modern` は、Crestodian の対話型セットアップ
  アシスタントに対する互換性エイリアスです。`openclaw crestodian` と同じ実推論ゲートを使用し、
  `--workspace`、`--accept-risk`、
  `--non-interactive`、`--json` のみを受け付けます。その他のセットアップフラグは、
  暗黙に無視されるのではなく拒否されます。

## ガイド付きフロー

引数なしの `openclaw onboard` はガイド付きフローを開始します。セキュリティに関する注意事項を表示し、
構成済みモデル、API キーの環境変数、サポートされているローカル CLI を通じて
すでに利用可能な AI アクセスを検出してから、推奨候補を実際の補完で
テストします。その候補が失敗した場合、オンボーディングは
理由を表示し、次に使用可能な候補を自動的に試します。

自動検出で候補がなくなると、プロバイダー選択画面には OpenAI、
Anthropic、xAI（Grok）、Google、OpenRouter が最初に表示されます。その他の
サポート対象プロバイダーをすべて表示するには、**その他…**を選択します。これらはプロバイダー別にグループ化され、
地域、プラン、認証方式が次のメニューに表示されます。サポートされているブラウザーまたはデバイスでのサインインと、
マスクされた API キーまたはトークン方式では、同じ実補完パスが使用されます。OpenClaw は、
テストが成功した後に、検証済みのモデルルートとその認証情報のみを永続化します。
失敗した候補によって、構成済みモデルが置き換えられたり、試行した
認証情報が保存されたりすることはありません。Crestodian を起動せずに終了するには
**今はスキップ**を選択し、準備ができたら `openclaw onboard` を再実行します。ワークスペースと Gateway のセットアップは、
Crestodian が起動するまで変更されません。

ガイド付きモードでは、`--workspace <dir>` により、Crestodian が提案するワークスペースと
分離された推論コンテキストが指定されます。Crestodian のセットアップ提案を承認するまで、
これは永続化されません。クラシックおよび非対話型オンボーディングでは、
通常のセットアップフローを通じてワークスペースが永続化されます。

推論が成功すると、ガイド付きオンボーディングは検証済みモデルで
直ちに Crestodian を起動します。その後、Crestodian でワークスペース、Gateway、
チャンネル、エージェント、プラグイン、その他のオプション機能を構成できます。Crestodian 内では、
`open channel wizard for <channel>` を使用して、チャンネル認証情報の収集を
マスク表示されるターミナルウィザードに引き渡します。モデルプロバイダーまたはその認証を変更するには、
Crestodian を終了して `openclaw onboard` を実行します。Crestodian からガイド付きまたは
クラシックのプロバイダーフローを開くことはできません。

構成済みのインストール環境で `openclaw onboard` を再度実行すると、まず現在の
デフォルトモデルが検証されるため、同じフローが検証および修復処理として機能します。
この確認が失敗しても、構成済みモデルが自動的に置き換えられることはありません。
オンボーディングは停止し、続行方法を確認します。この確認は
ワークスペースの外部で実行されるため、ワークスペースプラグインが提供するモデルは、
エージェント内で動作していても、ここでは失敗する場合があります。
プロバイダー固有の認証、チャンネル、Skills、
リモート Gateway のセットアップ、インポート、または Gateway の完全な制御には、`openclaw onboard --classic` を使用してください。推論以外の
対話型セットアップおよび修復には、`openclaw crestodian` を実行します。`openclaw onboard
--modern` は、同じ推論ゲートを通る互換性エイリアスです。クラシック
ウィザードでは、必要に応じて実際の補完によってデフォルトモデルを検証できますが、
Crestodian 自身の実推論チェックが成功するまで Crestodian は起動しません。

対話型ターミナルでは、引数なしの `openclaw`（サブコマンドなし）は構成
状態に応じて処理を振り分けます。

- アクティブな構成ファイルが存在しないか、作成済みの設定がない場合（空または
  メタデータのみ）、ガイド付きオンボーディングを開始します。
- 構成ファイルは存在するものの検証に失敗した場合、
  `openclaw doctor` の案内とともにクラシックオンボーディングパスを開始します。Crestodian には正常に動作する
  推論が必要であり、この推論前の状態の修復には使用されません。
- 構成ファイルが有効な場合、通常のエージェント TUI を開きます。到達可能な
  構成済み Gateway にエージェントとモデルがある場合、オンボーディングや
  Crestodian を経由せず、直接その UI に移動します。構成済みのインストール環境では、
  TUI 内の `/crestodian` または `openclaw crestodian` から Crestodian にアクセスします。

平文の `ws://` は、ループバック、プライベート IP リテラル、`.local`、Tailnet の `*.ts.net` Gateway URL で使用できます。その他の信頼済みプライベート DNS 名については、オンボーディングプロセスの環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

## リセット

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` はセットアップを実行する前に状態を消去します。`--reset-scope` は消去範囲を制御します。`config`（構成のみ）、`config+creds+sessions`（スコープなしで `--reset` を指定した場合のデフォルト）、または `full`（ワークスペースもリセット）を指定できます。ワークスペースのリセットは `--reset-scope full` の場合にのみ実行されます。

## ロケール

対話型オンボーディングでは、定型のセットアップ文言に CLI ウィザードのロケールを使用します。解決順序は次のとおりです。

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語へのフォールバック

サポートされているウィザードのロケールは `en`、`zh-CN`、`zh-TW` です。ロケール値には、`zh_CN.UTF-8` のようなアンダースコア形式または POSIX サフィックス形式も使用できます。製品名、コマンド名、構成キー、URL、プロバイダー ID、モデル ID、プラグインおよびチャンネルのラベルはそのまま維持されます。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非対話型セットアップ

`--non-interactive` には `--accept-risk` が必要です（エージェントは強力であり、システム全体へのアクセスにはリスクがあることを確認します）。`--mode` のデフォルトは `local` です。

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

`--custom-api-key` は任意です。省略した場合、オンボーディングは環境内の `CUSTOM_API_KEY` を確認します。OpenClaw は一般的なビジョンモデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral など）を画像対応として自動的にマークします。不明なカスタムビジョン ID には `--custom-image-input` を指定し、テキストのみのメタデータを強制するには `--custom-text-input` を指定します。`/v1/responses` はサポートするものの `/v1/chat/completions` はサポートしない OpenAI 互換エンドポイントには、`--custom-compatibility openai-responses` を使用します。有効な値は `openai`（デフォルト）、`openai-responses`、`anthropic` です。

LM Studio には、プロバイダー固有のキーフラグもあります。

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

`--secret-input-mode ref` を指定すると、オンボーディングは平文のキー値ではなく、環境変数に基づく参照を書き込みます。認証プロファイルを使用するプロバイダーでは `keyRef: { source: "env", provider: "default", id: <envVar> }` を書き込み、カスタムプロバイダーでは同様に `models.providers.<id>.apiKey`（たとえば `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）を書き込みます。契約として、オンボーディングプロセスの環境にプロバイダーの環境変数（たとえば `OPENAI_API_KEY`）を設定し、その環境変数が設定されていない限り、インラインキーフラグも同時に指定しないでください。対応する環境変数なしでフラグ値を指定すると、案内とともに即座に失敗します。

### Gateway 認証（非対話型）

- `--gateway-auth token --gateway-token <token>` は平文のトークンを保存します。`token` はデフォルトの認証モードです。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を環境変数の SecretRef として保存します。オンボーディングプロセスの環境に、その名前の空でない環境変数が必要です。
- `--gateway-token` と `--gateway-token-ref-env` は相互排他的です。
- `--install-daemon` を指定した場合、SecretRef で管理される `gateway.auth.token` は検証されますが、解決済みの平文としてスーパーバイザーサービスの環境メタデータに永続化されません。参照を解決できない場合、インストールは修復方法の案内とともに安全側に失敗します。`gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- ローカルオンボーディングは `gateway.mode="local"` を構成に書き込みます。後から構成ファイルに `gateway.mode` がない場合、それは構成の破損または不完全な手動編集を示しており、有効なローカルモードの省略指定ではありません。
- ローカルオンボーディングは、選択したセットアップパスに必要なダウンロード可能なプラグイン（たとえば、それらの認証方式用の Codex または Copilot ランタイムプラグイン）をインストールします。リモートオンボーディングは、リモート Gateway の接続情報のみを書き込み、ローカルのプラグインパッケージをインストールすることはありません。
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

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を待ってから正常終了します。
- `--install-daemon` は、最初に管理対象の Gateway インストールパスを開始します。指定しない場合、ローカル Gateway がすでに実行中である必要があります（例: `openclaw gateway run`）。
- 自動化で設定、ワークスペース、ブートストラップの書き込みのみを行う場合、`--skip-health` で待機をスキップします。
- `--skip-bootstrap` は `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` は最初にタスク スケジューラを試し、タスクの作成が拒否された場合はユーザー単位のスタートアップフォルダーのログイン項目にフォールバックします。

### 対話形式の参照モード

- プロンプトが表示されたら **シークレット参照を使用** を選択し、次に **環境変数** または設定済みのシークレットプロバイダー（`file` または `exec`）を選択します。
- オンボーディングは参照を保存する前に高速な事前検証を実行し、失敗した場合は再試行できます。

### Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントとモデルを自動検出します。Coding Plan エンドポイントでは `zai/glm-5.2` が優先され（利用できない場合は `glm-5.1` にフォールバック）、一般 API エンドポイントではデフォルトで `zai/glm-5.1` が使用されます。Coding Plan エンドポイントを強制するには、`zai-coding-global` または `zai-coding-cn` を直接選択します。
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

## その他の非対話形式フラグ

トークンベースのモデル認証（`--auth-choice token` とともに使用）:

| フラグ                          | 説明                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | トークンを発行するトークンプロバイダー ID                                                                                   |
| `--token <token>`               | モデル認証用のトークン値                                                                                                    |
| `--token-profile-id <id>`       | 認証プロファイル ID（デフォルトは `<provider>:manual`。プロバイダー所有の一部のフローでは、`anthropic:default` など独自のデフォルトを使用） |
| `--token-expires-in <duration>` | オプションのトークン有効期限（例: `365d`、`12h`）                                                  |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

デーモンのインストール制御: `--no-install-daemon` / `--skip-daemon`（エイリアス。Gateway サービスのインストールをスキップ）、`--daemon-runtime <node>`。

Skills: `--node-manager <npm|pnpm|bun>`（デフォルトは `npm`）、`--skip-skills`。

UI とフックのセットアップ: `--skip-ui`（Control UI/TUI のプロンプトをスキップ）、`--skip-hooks`（Webhook/フックのセットアップをスキップ）、`--skip-channels`、`--skip-search`。

出力: `--suppress-gateway-token-output` は、トークンを含む Gateway/UI の出力（トークンのヒント、トークンが埋め込まれた自動ログイン URL、Control UI の自動起動）を抑制します。共有ターミナルや CI で便利です。

<Note>
`--json` は、ガイド形式またはクラシック形式のオンボーディングで非対話形式モードを意味しません。
`--modern` とともに使用すると、JSON は Crestodian の概要を一度だけ出力し、その単一の結果の後に終了します。
その他のスクリプトでは `--non-interactive` を使用します。
</Note>

## プロバイダーの事前フィルタリング

認証の選択肢によって優先プロバイダーが決まる場合、オンボーディングはデフォルトモデルと許可リストの選択画面を、そのプロバイダーのモデルに事前フィルタリングします。このフィルターは同じ Plugin が所有する他のプロバイダーにも一致するため、`volcengine`/`volcengine-plan` や `byteplus`/`byteplus-plan` などの Coding Plan バリアントも対象になります。優先プロバイダーのフィルターで読み込み済みモデルが見つからない場合、選択画面を空のままにせず、オンボーディングはフィルタリングされていないカタログにフォールバックします。

## Web 検索の追加プロンプト

一部の Web 検索プロバイダーは、オンボーディング中にプロバイダー固有の追加プロンプトを表示します。

- **Grok** では、同じ xAI 認証と `x_search` モデルの選択を使用する、オプションの `x_search` セットアップが提示されることがあります。
- **Kimi** では、Moonshot API のリージョン（`api.moonshot.ai` または `api.moonshot.cn`）とデフォルトの Kimi Web 検索モデルを尋ねられることがあります。

## その他の動作

- ローカルオンボーディングにおける DM スコープの動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速で最初のチャットを開始する方法: `openclaw dashboard`（Control UI、チャネルのセットアップなし）。
- カスタムプロバイダー: 一覧にないホスト型プロバイダーを含む、OpenAI または Anthropic 互換の任意のエンドポイントに接続します。ライブプローブによる自動検出には、互換性として **不明** を使用します。
- Hermes の状態が検出された場合、オンボーディングは移行フローを提示します（上記の `--flow import` を参照）。

## 一般的な追加コマンド

推論以外の変更を個別に行う場合は後で `openclaw configure` を使用し、チャネルのみをセットアップする場合は `openclaw
channels add` を使用します。モデルプロバイダーまたは認証ルートを変更する場合は、
代わりに `openclaw onboard` を実行します。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
