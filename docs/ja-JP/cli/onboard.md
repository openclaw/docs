---
read_when:
    - Gateway、ワークスペース、認証、チャンネル、Skills のガイド付きセットアップが必要な場合
summary: '`openclaw onboard`（対話型オンボーディング）の CLI リファレンス'
title: オンボード
x-i18n:
    generated_at: "2026-06-27T10:58:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

ローカルまたはリモートの Gateway セットアップ向けの完全なガイド付きオンボーディング。モデル認証、ワークスペース、Gateway、チャンネル、Skills、ヘルスを1つのフローで OpenClaw に案内させたい場合に使用します。

## 関連ガイド

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローのウォークスルー。
  </Card>
  <Card title="Onboarding overview" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディング全体の構成。
  </Card>
  <Card title="CLI setup reference" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部動作、ステップごとの挙動。
  </Card>
  <Card title="CLI automation" href="/ja-JP/start/wizard-cli-automation" icon="terminal">
    非対話型フラグとスクリプト化されたセットアップ。
  </Card>
  <Card title="macOS app onboarding" href="/ja-JP/start/onboarding" icon="apple">
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

`--flow import` は Hermes などの Plugin 所有の移行プロバイダーを使用します。これは新規の OpenClaw セットアップに対してのみ実行されます。既存の設定、認証情報、セッション、またはワークスペースのメモリ/ID ファイルが存在する場合は、インポートする前にリセットするか、新しいセットアップを選択してください。

`--modern` は Crestodian の会話型オンボーディングプレビューを開始します。
`--modern` がない場合、`openclaw onboard` は従来のオンボーディングフローを維持します。

新規インストールでアクティブな設定ファイルが存在しない、または作成済み設定がない
（空、またはメタデータのみ）場合、単独の `openclaw` も従来の
オンボーディングフローを開始します。設定ファイルに作成済み設定が含まれると、単独の `openclaw`
は代わりに Crestodian を開きます。

プレーンテキストの `ws://` は、ループバック、プライベート IP リテラル、`.local`、および
Tailnet `*.ts.net` Gateway URL で受け入れられます。それ以外の信頼済みプライベート DNS 名では、
オンボーディングプロセス環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。

## ロケール

対話型オンボーディングでは、固定セットアップ文言に CLI ウィザードのロケールを使用します。解決
順序は次のとおりです。

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. 英語フォールバック

サポートされるウィザードロケールは `en`、`zh-CN`、`zh-TW` です。ロケール値では、
`zh_CN.UTF-8` のようなアンダースコア形式または POSIX サフィックス形式を使用できます。製品名、コマンド
名、設定キー、URL、プロバイダー ID、モデル ID、Plugin/チャンネルラベルは
リテラルのままです。

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
OpenClaw は一般的なビジョンモデル ID を画像対応として自動的にマークします。不明なカスタムビジョン ID には `--custom-image-input` を渡し、テキストのみのメタデータを強制するには `--custom-text-input` を渡します。
`/v1/responses` はサポートするが `/v1/chat/completions` はサポートしない OpenAI 互換エンドポイントには、`--custom-compatibility openai-responses` を使用します。

LM Studio は、非対話型モードでプロバイダー固有のキーフラグもサポートします。

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

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` などのクラウドモデル ID もここで機能します。

プロバイダーキーをプレーンテキストではなく参照として保存します。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を指定すると、オンボーディングはプレーンテキストのキー値ではなく env バックの参照を書き込みます。
auth-profile バックのプロバイダーでは `keyRef` エントリを書き込み、カスタムプロバイダーでは `models.providers.<id>.apiKey` を env 参照として書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型 `ref` モードの契約:

- オンボーディングプロセス環境でプロバイダーの環境変数を設定します（例: `OPENAI_API_KEY`）。
- その環境変数も設定されていない限り、インラインキーフラグ（例: `--openai-api-key`）を渡さないでください。
- 必須の環境変数なしでインラインキーフラグが渡された場合、オンボーディングは案内付きで即座に失敗します。

非対話型モードの Gateway トークンオプション:

- `--gateway-auth token --gateway-token <token>` はプレーンテキストトークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を env SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境内の空でない環境変数が必要です。
- `--install-daemon` を指定し、トークン認証でトークンが必要な場合、SecretRef 管理の Gateway トークンは検証されますが、解決済みプレーンテキストとして supervisor サービス環境メタデータには永続化されません。
- `--install-daemon` を指定し、トークンモードでトークンが必要で、設定されたトークン SecretRef が解決できない場合、オンボーディングは修復案内付きでフェイルクローズします。
- `--install-daemon` を指定し、`gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、オンボーディングはモードが明示的に設定されるまでインストールをブロックします。
- ローカルオンボーディングは `gateway.mode="local"` を設定に書き込みます。後の設定ファイルで `gateway.mode` が欠落している場合、それを有効なローカルモードのショートカットではなく、設定破損または不完全な手動編集として扱ってください。
- ローカルオンボーディングは、選択したセットアップパスが必要とする場合、選択済みのダウンロード可能 Plugin をインストールします。
- リモートオンボーディングはリモート Gateway の接続情報のみを書き込み、ローカル Plugin パッケージはインストールしません。
- `--allow-unconfigured` は別個の Gateway ランタイム用エスケープハッチです。これはオンボーディングが `gateway.mode` を省略してよいという意味ではありません。

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
- `--install-daemon` は管理対象 Gateway のインストールパスを先に開始します。指定しない場合は、たとえば `openclaw gateway run` などでローカル Gateway をすでに実行している必要があります。
- 自動化で設定/ワークスペース/ブートストラップの書き込みだけが必要な場合は、`--skip-health` を使用します。
- ワークスペースファイルを自分で管理する場合は、`--skip-bootstrap` を渡して `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザー単位の Startup フォルダーのログイン項目にフォールバックします。

参照モードでの対話型オンボーディングの挙動:

- プロンプトが表示されたら **Use secret reference** を選択します。
- 次に、次のいずれかを選択します。
  - 環境変数
  - 設定済みシークレットプロバイダー（`file` または `exec`）
- オンボーディングは参照を保存する前に高速なプリフライト検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。

### 非対話型 Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントとモデルを自動検出します。
Coding Plan エンドポイントでは `zai/glm-5.2` が優先され、一般 API エンドポイントでは
`zai/glm-5.1` が使用されます。Coding Plan エンドポイントを強制するには、`zai-coding-global` または
`zai-coding-cn` を選択します。
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## フローのメモ

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
    - `manual`: ポート、バインド、認証に関する完全なプロンプト（`advanced` のエイリアス）。
    - `import`: 検出された移行プロバイダーを実行し、計画をプレビューしてから、確認後に適用します。

  </Accordion>
  <Accordion title="Provider prefiltering">
    認証の選択が優先プロバイダーを示す場合、オンボーディングはデフォルトモデルと allowlist のピッカーをそのプロバイダーに事前フィルタリングします。Volcengine と BytePlus では、coding-plan バリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。

    優先プロバイダーフィルターでまだ読み込まれたモデルが得られない場合、オンボーディングはピッカーを空のままにするのではなく、フィルタリングされていないカタログにフォールバックします。

  </Accordion>
  <Accordion title="Web-search follow-ups">
    一部の Web 検索プロバイダーは、プロバイダー固有のフォローアッププロンプトをトリガーします。

    - **Grok** は、同じ xAI OAuth プロファイルまたは API キーと `x_search` モデル選択を使った任意の `x_search` セットアップを提示できます。
    - **Kimi** は Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）およびデフォルトの Kimi Web 検索モデルを尋ねることがあります。

  </Accordion>
  <Accordion title="Other behaviors">
    - ローカルオンボーディングの DM スコープ挙動: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
    - 最速の初回チャット: `openclaw dashboard`（Control UI、チャンネルセットアップなし）。
    - カスタムプロバイダー: 一覧にないホスト型プロバイダーを含め、任意の OpenAI または Anthropic 互換エンドポイントに接続します。自動検出するには Unknown を使用します。
    - Hermes の状態が検出された場合、オンボーディングは移行フローを提示します。ドライラン計画、上書きモード、レポート、正確なマッピングには [Migrate](/ja-JP/cli/migrate) を使用します。

  </Accordion>
</AccordionGroup>

## 一般的なフォローアップコマンド

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

ベースラインの設定/ワークスペースだけが必要な場合は、代わりに `openclaw setup` を使用します。対象を絞った変更には後で `openclaw configure` を使用し、チャンネルのみのセットアップには `openclaw channels add` を使用します。

<Note>
`--json` は非対話型モードを意味しません。スクリプトでは `--non-interactive` を使用します。
</Note>
