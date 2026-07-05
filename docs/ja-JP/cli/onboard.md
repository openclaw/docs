---
read_when:
    - Gateway、ワークスペース、認証、チャンネル、Skills のガイド付きセットアップを利用したい
summary: '`openclaw onboard`（対話型オンボーディング）の CLI リファレンス'
title: オンボーディング
x-i18n:
    generated_at: "2026-07-05T11:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45cd22d23b9e3121a75c7695568cc6a03381daa6e56a64b36f407605bb4d1732
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

モデル認証、ワークスペース、Gateway、チャンネル、Skills、ヘルスを1つのフローで案内するセットアップです。`openclaw setup` は同じエントリーポイントです。`openclaw setup --baseline` はベースライン設定/ワークスペースのみを書き込みます。

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローのウォークスルー。
  </Card>
  <Card title="オンボーディングの概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体の仕組み。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部構造、ステップごとの動作。
  </Card>
  <Card title="CLI 自動化" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非対話型フラグとスクリプト化されたセットアップ。
  </Card>
  <Card title="macOS アプリのオンボーディング" href="/ja-JP/start/onboarding" icon="apple">
    macOS メニューバーアプリのオンボーディングフロー。
  </Card>
</CardGroup>

## 例

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--flow quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
- `--flow manual`（別名 `advanced`）: ポート、バインド、認証の完全なプロンプト。
- `--flow import`: 検出された移行プロバイダー（例: `--import-from hermes` 経由の Hermes）を実行し、計画をプレビューしてから、確認後に適用します。インポートは新規の OpenClaw セットアップに対してのみ実行されます。既存の設定、認証情報、セッション、ワークスペース状態がある場合は先にリセットしてください。ドライラン計画、上書きモード、レポート、正確なマッピングには [`openclaw migrate`](/ja-JP/cli/migrate) を使用します。
- `--modern` は、従来のフローの代わりに Crestodian の対話型セットアップ/修復アシスタントを開始します。

対話型ターミナルでは、素の `openclaw`（サブコマンドなし）は設定状態に応じてルーティングされます。

- アクティブな設定ファイルが存在しない、または作成済み設定がない（空または
  メタデータのみ）場合、この従来のオンボーディングフローを開始します。
- 設定ファイルは存在するが検証に失敗した場合、修復のために
  [Crestodian](/ja-JP/cli/crestodian) を開始します。
- 設定ファイルが有効な場合、通常のエージェント TUI を開きます。これはローカル、
  または到達可能な設定済み Gateway に接続された状態です。設定済みインストールでは、
  TUI 内の `/crestodian` または `openclaw crestodian` で Crestodian にアクセスできます。

平文の `ws://` は、loopback、プライベート IP リテラル、`.local`、および Tailnet `*.ts.net` Gateway URL で受け入れられます。その他の信頼済みプライベート DNS 名では、オンボーディングプロセス環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。

## リセット

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` はセットアップ実行前に状態を消去します。`--reset-scope` は範囲を制御します: `config`（設定のみ）、`config+creds+sessions`（スコープなしで `--reset` が渡された場合のデフォルト）、または `full`（ワークスペースもリセット）。ワークスペースのリセットは `--reset-scope full` の場合にのみ発生します。

## ロケール

対話型オンボーディングでは、固定のセットアップ文言に CLI ウィザードのロケールを使用します。解決順序:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語フォールバック

サポートされるウィザードロケールは `en`、`zh-CN`、`zh-TW` です。ロケール値には、`zh_CN.UTF-8` のようなアンダースコア形式または POSIX サフィックス形式を使用できます。製品名、コマンド名、設定キー、URL、プロバイダー ID、モデル ID、Plugin/チャンネルラベルはリテラルのままです。

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## 非対話型セットアップ

`--non-interactive` には `--accept-risk` が必要です（エージェントは強力で、システム全体へのアクセスにはリスクがあることを認めます）。`--mode` のデフォルトは `local` です。

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

`--custom-api-key` は任意です。省略した場合、オンボーディングは環境内の `CUSTOM_API_KEY` を確認します。OpenClaw は一般的なビジョンモデル ID（GPT-4o/4.1/5.x、Claude 3/4、Gemini、Qwen-VL、LLaVA、Pixtral など）を画像対応として自動的にマークします。不明なカスタムビジョン ID には `--custom-image-input` を渡し、テキスト専用メタデータを強制するには `--custom-text-input` を渡します。`/v1/responses` をサポートするが `/v1/chat/completions` はサポートしない OpenAI 互換エンドポイントには `--custom-compatibility openai-responses` を使用します。有効な値は `openai`（デフォルト）、`openai-responses`、`anthropic` です。

LM Studio にはプロバイダー固有のキーフラグもあります。

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非対話型 Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` のようなクラウドモデル ID もここで動作します。

プロバイダーキーを平文ではなく参照として保存します:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使うと、オンボーディングは平文のキー値ではなく env に基づく参照を書き込みます。auth-profile-backed provider では `keyRef: { source: "env", provider: "default", id: <envVar> }` を書き込み、カスタム provider では同じ方法で `models.providers.<id>.apiKey` を書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。契約: provider の環境変数をオンボーディングプロセスの環境に設定し（例: `OPENAI_API_KEY`）、その環境変数が設定されていない限りインラインキーのフラグも渡さないでください。対応する環境変数なしにフラグ値を渡すと、案内付きで即座に失敗します。

### Gateway 認証（非対話）

- `--gateway-auth token --gateway-token <token>` は平文の token を保存します。`token` がデフォルトの認証モードです。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を env SecretRef として保存します。オンボーディングプロセスの環境に、その名前の空でない環境変数が必要です。
- `--gateway-token` と `--gateway-token-ref-env` は同時に指定できません。
- `--install-daemon` を指定した場合: SecretRef 管理の `gateway.auth.token` は検証されますが、解決済みの平文として supervisor サービス環境メタデータには永続化されません。参照を解決できない場合、インストールは修復案内付きで fail closed します。`gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストールはブロックされます。
- ローカルオンボーディングは設定に `gateway.mode="local"` を書き込みます。後続の設定ファイルで `gateway.mode` が欠落している場合、それは設定の破損または不完全な手動編集を示し、有効なローカルモードのショートカットではありません。
- ローカルオンボーディングは、選択されたセットアップ経路に必要なダウンロード可能 Plugin をインストールします（例: それらの認証選択肢用の Codex または Copilot ランタイム Plugin）。リモートオンボーディングはリモート Gateway の接続情報だけを書き込み、ローカル Plugin パッケージは一切インストールしません。
- `--allow-unconfigured` は別個の `openclaw gateway run` 用エスケープハッチです。オンボーディングが `gateway.mode` を省略できるようにはしません。

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### ローカル Gateway ヘルス

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル gateway を待ってから正常終了します。
- `--install-daemon` は、まず管理対象 gateway のインストール経路を開始します。指定しない場合、ローカル gateway はすでに実行中である必要があります（例: `openclaw gateway run`）。
- 自動化で設定、ワークスペース、bootstrap の書き込みだけを行いたい場合、`--skip-health` で待機をスキップできます。
- `--skip-bootstrap` は `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザー単位の Startup フォルダーのログイン項目にフォールバックします。

### 対話式 ref モード

- プロンプトで **Use secret reference** を選び、続いて **Environment variable** または設定済みの secret provider（`file` または `exec`）を選びます。
- オンボーディングは ref を保存する前に高速な preflight 検証を実行し、失敗時には再試行できます。

### Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントとモデルを自動検出します。Coding Plan エンドポイントは `zai/glm-5.2` を優先し（利用できない場合は `glm-5.1` にフォールバック）、一般 API エンドポイントはデフォルトで `zai/glm-5.1` を使います。Coding Plan エンドポイントを強制するには、`zai-coding-global` または `zai-coding-cn` を直接選択してください。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 追加の非対話フラグ

Token ベースのモデル認証（`--auth-choice token` と一緒に使用）:

| フラグ                          | 説明                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | token を発行する token provider id                                                                                          |
| `--token <token>`               | モデル認証用の token 値                                                                                                     |
| `--token-profile-id <id>`       | 認証 profile id（デフォルトは `<provider>:manual`。一部の provider 所有フローは `anthropic:default` など独自のデフォルトを使用） |
| `--token-expires-in <duration>` | 任意の token 有効期限 duration（例: `365d`、`12h`）                                                                          |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`、`--cloudflare-ai-gateway-gateway-id <id>`。

Daemon インストール制御: `--no-install-daemon` / `--skip-daemon`（エイリアス。gateway サービスのインストールをスキップ）、`--daemon-runtime <node|bun>`。

Skills: `--node-manager <npm|pnpm|bun>`（デフォルト `npm`）、`--skip-skills`。

UI と hook セットアップ: `--skip-ui`（Control UI/TUI プロンプトをスキップ）、`--skip-hooks`（Webhook/hook セットアップをスキップ）、`--skip-channels`、`--skip-search`。

出力: `--suppress-gateway-token-output` は token を含む Gateway/UI 出力（token ヒント、埋め込み token 付き自動ログイン URL、自動 Control UI 起動）を抑制します。共有端末や CI で便利です。

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使ってください。
</Note>

## Provider の事前フィルタリング

認証選択肢が優先 provider を示す場合、オンボーディングは default-model と allowlist の picker をその provider のモデルに事前フィルタリングします。このフィルターは同じ Plugin が所有する他の provider にも一致するため、`volcengine`/`volcengine-plan` や `byteplus`/`byteplus-plan` のような coding-plan バリアントも対象になります。優先 provider フィルターで読み込み済みモデルが 1 件も得られない場合、オンボーディングは picker を空にせず、未フィルターの catalog にフォールバックします。

## Web 検索のフォローアップ

一部の Web 検索 provider は、オンボーディング中に provider 固有のフォローアッププロンプトを表示します。

- **Grok** は、同じ xAI 認証と `x_search` モデル選択を使った任意の `x_search` セットアップを提示できます。
- **Kimi** は、Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）とデフォルトの Kimi Web 検索モデルを尋ねることができます。

## その他の動作

- ローカルオンボーディングの DM スコープ動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速の最初のチャット: `openclaw dashboard` (Control UI、チャンネル設定なし)。
- カスタムプロバイダー: 一覧にないホスト型プロバイダーを含め、OpenAI または Anthropic 互換エンドポイントに接続できます。ライブプローブで自動検出するには、**Unknown** 互換性を使用します。
- Hermes state が検出された場合、オンボーディングで移行フローが提示されます (上記の `--flow import` を参照)。

## よく使うフォローアップコマンド

あとで対象を絞った変更には `openclaw configure` を、チャンネルのみの設定には `openclaw channels add` を使用します。

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
