---
read_when:
    - Gateway、ワークスペース、認証、チャンネル、Skills のガイド付きセットアップが必要な場合
summary: '`openclaw onboard` の CLI リファレンス（インタラクティブなオンボーディング）'
title: オンボード
x-i18n:
    generated_at: "2026-07-04T20:24:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

ローカルまたはリモート Gateway セットアップのための完全なガイド付きオンボーディングです。OpenClaw に、モデル認証、ワークスペース、Gateway、チャンネル、Skills、ヘルスを 1 つのフローで順に案内させたい場合に使います。

## 関連ガイド

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローのウォークスルーです。
  </Card>
  <Card title="オンボーディング概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体のつながりです。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部構造、ステップごとの動作です。
  </Card>
  <Card title="CLI 自動化" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非対話型フラグとスクリプト化されたセットアップです。
  </Card>
  <Card title="macOS アプリのオンボーディング" href="/ja-JP/start/onboarding" icon="apple">
    macOS メニューバーアプリのオンボーディングフローです。
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

`--flow import` は Hermes などの Plugin 所有の移行プロバイダーを使います。これは新しい OpenClaw セットアップに対してのみ実行されます。既存の設定、認証情報、セッション、またはワークスペースのメモリ/ID ファイルが存在する場合は、インポート前にリセットするか、新しいセットアップを選択してください。

`--modern` は Crestodian の会話型オンボーディングプレビューを開始します。`--modern` がない場合、`openclaw onboard` は従来のオンボーディングフローを維持します。

対話型ターミナルでは、裸の `openclaw`（サブコマンドなし）は設定状態に応じてルーティングされます。

- アクティブな設定ファイルがない、または作成済み設定がない（空またはメタデータのみ）場合、この従来のオンボーディングフローを開始します。
- 設定ファイルは存在するが検証に失敗する場合、修復のために [Crestodian](/ja-JP/cli/crestodian) を開始します。
- 設定ファイルが有効な場合、通常のエージェント TUI を開きます。ローカルで開くか、到達可能な設定済み Gateway に接続します。設定済みインストールでは、TUI 内の `/crestodian` または `openclaw crestodian` で Crestodian にアクセスできます。

平文の `ws://` は、loopback、プライベート IP リテラル、`.local`、および Tailnet `*.ts.net` の Gateway URL で受け付けられます。その他の信頼済みプライベート DNS 名では、オンボーディングプロセス環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

## ロケール

対話型オンボーディングは、固定セットアップ文言に CLI ウィザードのロケールを使います。解決順序は次のとおりです。

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語フォールバック

対応するウィザードロケールは `en`、`zh-CN`、`zh-TW` です。ロケール値には `zh_CN.UTF-8` のようなアンダースコア形式または POSIX サフィックス形式を使えます。製品名、コマンド名、設定キー、URL、プロバイダー ID、モデル ID、Plugin/チャンネルラベルはリテラルのままです。

例:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

非対話型カスタムプロバイダー:

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

`--custom-api-key` は非対話型モードでは任意です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。
OpenClaw は一般的なビジョンモデル ID を画像対応として自動的にマークします。不明なカスタムビジョン ID には `--custom-image-input` を渡し、テキスト専用メタデータを強制するには `--custom-text-input` を渡してください。
`/v1/responses` は対応しているが `/v1/chat/completions` には対応していない OpenAI 互換エンドポイントには、`--custom-compatibility openai-responses` を使います。

LM Studio は非対話型モードでプロバイダー固有のキーフラグにも対応しています。

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

`--custom-base-url` の既定値は `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨既定値を使います。`kimi-k2.5:cloud` などのクラウドモデル ID もここで動作します。

プロバイダーキーを平文ではなく参照として保存します。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使うと、オンボーディングは平文キー値ではなく env バックの参照を書き込みます。
認証プロファイルで裏付けられたプロバイダーでは `keyRef` エントリを書き込みます。カスタムプロバイダーでは、`models.providers.<id>.apiKey` を env 参照として書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型 `ref` モードの契約:

- オンボーディングプロセス環境にプロバイダー env var を設定します（例: `OPENAI_API_KEY`）。
- その env var も設定されている場合を除き、インラインキーフラグ（例: `--openai-api-key`）を渡さないでください。
- 必須 env var なしでインラインキーフラグが渡された場合、オンボーディングはガイダンス付きで即座に失敗します。

非対話型モードの Gateway トークンオプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を env SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境内の空でない env var が必要です。
- `--install-daemon` を使い、トークン認証がトークンを必要とする場合、SecretRef 管理の Gateway トークンは検証されますが、解決済み平文として supervisor サービス環境メタデータに永続化されません。
- `--install-daemon` を使い、トークンモードがトークンを必要とし、設定済みトークン SecretRef が未解決の場合、オンボーディングは修復ガイダンス付きで fail closed します。
- `--install-daemon` を使い、`gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、オンボーディングはモードが明示的に設定されるまでインストールをブロックします。
- ローカルオンボーディングは設定に `gateway.mode="local"` を書き込みます。後続の設定ファイルに `gateway.mode` がない場合、それは有効なローカルモードのショートカットではなく、設定破損または不完全な手動編集として扱ってください。
- ローカルオンボーディングは、選択したセットアップパスが必要とする選択済みダウンロード可能 Plugin をインストールします。
- リモートオンボーディングは、リモート Gateway の接続情報のみを書き込み、ローカル Plugin パッケージはインストールしません。
- `--allow-unconfigured` は別個の Gateway ランタイム回避ハッチです。オンボーディングが `gateway.mode` を省略してよいという意味ではありません。

例:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

非対話型ローカル Gateway ヘルス:

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカル Gateway を待ってから正常終了します。
- `--install-daemon` は、管理対象 Gateway インストールパスを先に開始します。指定しない場合、たとえば `openclaw gateway run` などでローカル Gateway がすでに実行中である必要があります。
- 自動化で設定/ワークスペース/bootstrap の書き込みだけを行いたい場合は、`--skip-health` を使います。
- ワークスペースファイルを自分で管理する場合は、`--skip-bootstrap` を渡して `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザー単位の Startup フォルダーのログイン項目にフォールバックします。

参照モードでの対話型オンボーディング動作:

- プロンプトが表示されたら **Use secret reference** を選択します。
- 次に、次のいずれかを選択します。
  - 環境変数
  - 設定済みシークレットプロバイダー（`file` または `exec`）
- オンボーディングは ref の保存前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。

### 非対話型 Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントとモデルを自動検出します。Coding Plan エンドポイントは `zai/glm-5.2` を優先し、一般 API エンドポイントは `zai/glm-5.1` を使います。Coding Plan エンドポイントを強制するには、`zai-coding-global` または `zai-coding-cn` を選択します。
</Note>

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# その他の Z.AI エンドポイント選択肢:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非対話型 Mistral の例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## 追加の非対話型フラグ

トークンベースのモデル認証（非対話型、`--auth-choice token` と併用）:

- `--token-provider <id>` — トークンプロバイダー ID。どのプロバイダーがトークンを発行するかを識別します。
- `--token <token>` — モデル認証用のトークン値。
- `--token-profile-id <id>` — 認証プロファイル ID。汎用トークンストレージの既定値は `<provider>:manual` です。プロバイダー所有のセットアップフローでは、`anthropic:default` など独自の既定値を使う場合があります。
- `--token-expires-in <duration>` — 任意のトークン有効期限（例: `365d`、`12h`）。

Cloudflare AI Gateway（非対話型）:

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare AI Gateway 経由のルーティングに使う Cloudflare Account ID。
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID。

Daemon インストール制御:

- `--no-install-daemon` — Gateway サービスのインストールを明示的にスキップします。
- `--skip-daemon` — `--no-install-daemon` のエイリアス。

UI と hook セットアップ制御:

- `--skip-ui` — オンボーディング中の Control UI / TUI プロンプトをスキップします。
- `--skip-hooks` — オンボーディング中の Webhook / hook セットアッププロンプトをスキップします。

出力抑制:

- `--suppress-gateway-token-output` — トークンを含む Gateway/UI 出力（トークンヒント、埋め込みトークン付き自動ログイン URL、自動 Control UI 起動）を抑制します。共有ターミナルや CI 環境で有用です。

## フローノート

<AccordionGroup>
  <Accordion title="フロータイプ">
    - `quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
    - `manual`: ポート、バインド、認証の完全なプロンプト（`advanced` のエイリアス）。
    - `import`: 検出された移行プロバイダーを実行し、計画をプレビューしてから、確認後に適用します。

  </Accordion>
  <Accordion title="プロバイダーの事前フィルタリング">
    認証選択が優先プロバイダーを意味する場合、オンボーディングは既定モデルと許可リストのピッカーをそのプロバイダーに事前フィルタリングします。Volcengine と BytePlus では、coding-plan バリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。

    優先プロバイダーフィルターで読み込み済みモデルがまだ得られない場合、オンボーディングはピッカーを空のままにせず、未フィルタリングのカタログにフォールバックします。

  </Accordion>
  <Accordion title="Web 検索のフォローアップ">
    一部の Web 検索プロバイダーは、プロバイダー固有のフォローアッププロンプトをトリガーします。

    - **Grok** は、同じ xAI OAuth プロファイルまたは API キーと `x_search` モデル選択を使う任意の `x_search` セットアップを提示できます。
    - **Kimi** は、Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）と既定の Kimi Web 検索モデルを尋ねる場合があります。

  </Accordion>
  <Accordion title="その他の動作">
    - ローカルオンボーディングの DM スコープ動作: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
    - 最速の初回チャット: `openclaw dashboard`（Control UI、チャンネルセットアップなし）。
    - カスタムプロバイダー: OpenAI または Anthropic 互換エンドポイントを任意に接続できます。リストにないホスト型プロバイダーも含みます。自動検出するには Unknown を使います。
    - Hermes 状態が検出された場合、オンボーディングは移行フローを提示します。dry-run 計画、上書きモード、レポート、正確なマッピングには [移行](/ja-JP/cli/migrate) を使います。

  </Accordion>
</AccordionGroup>

## 一般的なフォローアップコマンド

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

`openclaw setup` は同じガイド付きオンボーディングのエントリーポイントとして使用します。ベースラインの設定/ワークスペースだけが必要な場合は `openclaw setup --baseline` を使用し、対象を絞った変更には後で `openclaw configure` を使用し、チャンネルのみのセットアップには `openclaw channels add` を使用します。

<Note>
`--json` は非対話モードを意味しません。スクリプトには `--non-interactive` を使用してください。
</Note>
