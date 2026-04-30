---
read_when:
    - Gateway、ワークスペース、認証、チャネル、Skills のガイド付きセットアップを行いたい場合
summary: '`openclaw onboard` の CLI リファレンス（インタラクティブなオンボーディング）'
title: オンボード
x-i18n:
    generated_at: "2026-04-30T05:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

ローカルまたはリモートの Gateway セットアップのための対話型オンボーディング。

## 関連ガイド

<CardGroup cols={2}>
  <Card title="CLI オンボーディングハブ" href="/ja-JP/start/wizard" icon="rocket">
    対話型 CLI フローの手順。
  </Card>
  <Card title="オンボーディング概要" href="/ja-JP/start/onboarding-overview" icon="map">
    OpenClaw のオンボーディングがどのように連携するか。
  </Card>
  <Card title="CLI セットアップリファレンス" href="/ja-JP/start/wizard-cli-reference" icon="book">
    出力、内部動作、ステップごとの挙動。
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

`--flow import` は Hermes など、Plugin が所有する移行プロバイダーを使用します。これは新規の OpenClaw セットアップに対してのみ実行されます。既存の設定、認証情報、セッション、またはワークスペースのメモリ/アイデンティティファイルが存在する場合は、インポート前にリセットするか、新規セットアップを選択してください。

`--modern` は Crestodian の会話型オンボーディングプレビューを開始します。
`--modern` なしでは、`openclaw onboard` は従来のオンボーディングフローを維持します。

平文のプライベートネットワーク `ws://` ターゲット（信頼済みネットワークのみ）では、オンボーディングプロセス環境で
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定します。
このクライアント側トランスポートの緊急回避に相当する `openclaw.json` の設定はありません。

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

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意です。省略した場合、オンボーディングは Ollama の推奨デフォルトを使用します。`kimi-k2.5:cloud` などのクラウドモデル ID もここで使用できます。

プロバイダーキーを平文ではなく参照として保存します。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使用すると、オンボーディングは平文のキー値ではなく、環境に基づく参照を書き込みます。
auth-profile に基づくプロバイダーでは `keyRef` エントリを書き込み、カスタムプロバイダーでは `models.providers.<id>.apiKey` を環境参照として書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型 `ref` モード契約:

- オンボーディングプロセス環境でプロバイダーの環境変数を設定します（例: `OPENAI_API_KEY`）。
- その環境変数も設定されていない限り、インラインキーフラグ（例: `--openai-api-key`）を渡さないでください。
- 必要な環境変数なしでインラインキーフラグを渡した場合、オンボーディングはガイダンスを表示して即座に失敗します。

非対話型モードでの Gateway トークンオプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を環境 SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境で空でない環境変数が必要です。
- `--install-daemon` を使用し、トークン認証でトークンが必要な場合、SecretRef 管理の Gateway トークンは検証されますが、supervisor サービス環境メタデータ内に解決済み平文として永続化されません。
- `--install-daemon` を使用し、トークンモードでトークンが必要で、設定済みのトークン SecretRef が解決不能な場合、オンボーディングは修復ガイダンスを表示して安全側に失敗します。
- `--install-daemon` を使用し、`gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、オンボーディングはモードが明示的に設定されるまでインストールをブロックします。
- ローカルオンボーディングは設定に `gateway.mode="local"` を書き込みます。後続の設定ファイルに `gateway.mode` がない場合、それを有効なローカルモードのショートカットではなく、設定の破損または不完全な手動編集として扱ってください。
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
- `--install-daemon` は管理対象 Gateway のインストールパスを先に開始します。指定しない場合は、たとえば `openclaw gateway run` などで、ローカル Gateway がすでに実行中である必要があります。
- 自動化で設定/ワークスペース/bootstrap の書き込みだけが必要な場合は、`--skip-health` を使用します。
- ワークスペースファイルを自分で管理する場合は、`--skip-bootstrap` を渡して `agents.defaults.skipBootstrap: true` を設定し、`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` の作成をスキップします。
- ネイティブ Windows では、`--install-daemon` はまず Scheduled Tasks を試し、タスク作成が拒否された場合はユーザー単位の Startup フォルダーのログイン項目にフォールバックします。

参照モードでの対話型オンボーディングの挙動:

- プロンプトが表示されたら **秘密参照を使用** を選択します。
- 次に、次のいずれかを選択します。
  - 環境変数
  - 設定済みシークレットプロバイダー（`file` または `exec`）
- オンボーディングは参照を保存する前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。

### 非対話型 Z.AI エンドポイントの選択肢

<Note>
`--auth-choice zai-api-key` はキーに最適な Z.AI エンドポイントを自動検出します（`zai/glm-5.1` を使用する一般 API を優先）。GLM Coding Plan エンドポイントを特に使用したい場合は、`zai-coding-global` または `zai-coding-cn` を選択してください。
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

## フローの注記

<AccordionGroup>
  <Accordion title="フロータイプ">
    - `quickstart`: 最小限のプロンプトで、Gateway トークンを自動生成します。
    - `manual`: ポート、バインド、認証に関する完全なプロンプト（`advanced` のエイリアス）。
    - `import`: 検出された移行プロバイダーを実行し、プランをプレビューしてから、確認後に適用します。

  </Accordion>
  <Accordion title="プロバイダーの事前フィルタリング">
    認証の選択肢が優先プロバイダーを示す場合、オンボーディングはデフォルトモデルと許可リストのピッカーをそのプロバイダーに事前フィルタリングします。Volcengine と BytePlus では、これは coding-plan バリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。

    優先プロバイダーフィルターで読み込まれたモデルがまだ見つからない場合、オンボーディングはピッカーを空のままにせず、フィルターなしのカタログにフォールバックします。

  </Accordion>
  <Accordion title="Web 検索フォローアップ">
    一部の Web 検索プロバイダーは、プロバイダー固有のフォローアッププロンプトをトリガーします。

    - **Grok** は同じ `XAI_API_KEY` と `x_search` モデル選択を使った任意の `x_search` セットアップを提示できます。
    - **Kimi** は Moonshot API リージョン（`api.moonshot.ai` と `api.moonshot.cn`）とデフォルトの Kimi Web 検索モデルを尋ねることがあります。

  </Accordion>
  <Accordion title="その他の挙動">
    - ローカルオンボーディング DM スコープの挙動: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
    - 最速の最初のチャット: `openclaw dashboard`（Control UI、チャンネルセットアップなし）。
    - カスタムプロバイダー: 一覧にないホステッドプロバイダーを含め、OpenAI または Anthropic 互換エンドポイントに接続します。自動検出するには Unknown を使用します。
    - Hermes の状態が検出された場合、オンボーディングは移行フローを提示します。ドライランプラン、上書きモード、レポート、正確なマッピングには [Migrate](/ja-JP/cli/migrate) を使用します。

  </Accordion>
</AccordionGroup>

## 一般的なフォローアップコマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話型モードを意味しません。スクリプトでは `--non-interactive` を使用してください。
</Note>
