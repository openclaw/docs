---
read_when:
    - Gateway、ワークスペース、認証、チャネル、およびSkillsのガイド付きセットアップが必要な場合
summary: '`openclaw onboard` のCLIリファレンス（対話型オンボーディング）'
title: オンボーディング
x-i18n:
    generated_at: "2026-04-24T04:51:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab92ff5651b7db18850558cbb47527bf0486f278c8aed0929eaeff0017b6c280
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

ローカルまたはリモートGatewayセットアップ向けの対話型オンボーディングです。

## 関連ガイド

- CLIオンボーディングハブ: [Onboarding (CLI)](/ja-JP/start/wizard)
- オンボーディング概要: [Onboarding Overview](/ja-JP/start/onboarding-overview)
- CLIオンボーディングリファレンス: [CLI Setup Reference](/ja-JP/start/wizard-cli-reference)
- CLI自動化: [CLI Automation](/ja-JP/start/wizard-cli-automation)
- macOSオンボーディング: [Onboarding (macOS App)](/ja-JP/start/onboarding)

## 例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

プレーンテキストのプライベートネットワーク`ws://`ターゲット（信頼できるネットワークのみ）では、
オンボーディングプロセス環境で`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`を設定してください。

非対話型のカスタムプロバイダー:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

非対話モードでは`--custom-api-key`は省略可能です。省略した場合、オンボーディングは`CUSTOM_API_KEY`を確認します。

LM Studioは、非対話モードでプロバイダー固有のキーフラグもサポートします。

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

非対話型のOllama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url`のデフォルトは`http://127.0.0.1:11434`です。`--custom-model-id`は省略可能です。省略した場合、オンボーディングはOllamaの推奨デフォルトを使用します。`kimi-k2.5:cloud`のようなクラウドモデルIDもここで使用できます。

プロバイダーキーをプレーンテキストではなくrefとして保存するには:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref`を使用すると、オンボーディングはプレーンテキストのキー値ではなく、環境変数バックのrefを書き込みます。
authプロファイルバックのプロバイダーでは`keyRef`エントリが書き込まれ、カスタムプロバイダーでは`models.providers.<id>.apiKey`がenv refとして書き込まれます（たとえば`{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型`ref`モードの契約:

- オンボーディングプロセス環境でプロバイダーの環境変数を設定してください（たとえば`OPENAI_API_KEY`）。
- その環境変数も設定されていない限り、インラインキーフラグ（たとえば`--openai-api-key`）を渡さないでください。
- 必要な環境変数なしでインラインキーフラグが渡された場合、オンボーディングはガイダンス付きで即座に失敗します。

非対話モードでのGatewayトークンオプション:

- `--gateway-auth token --gateway-token <token>`はプレーンテキストトークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>`は`gateway.auth.token`をenv SecretRefとして保存します。
- `--gateway-token`と`--gateway-token-ref-env`は相互排他的です。
- `--gateway-token-ref-env`には、オンボーディングプロセス環境内に空でない環境変数が必要です。
- `--install-daemon`使用時にトークン認証でトークンが必要な場合、SecretRef管理のGatewayトークンは検証されますが、解決済みプレーンテキストとしてsupervisorサービス環境メタデータに永続化されることはありません。
- `--install-daemon`使用時にトークンモードでトークンが必要かつ設定済みトークンSecretRefが未解決の場合、オンボーディングは修復ガイダンス付きでクローズド失敗します。
- `--install-daemon`使用時に`gateway.auth.token`と`gateway.auth.password`の両方が設定されていて、`gateway.auth.mode`が未設定の場合、オンボーディングはモードが明示設定されるまでインストールをブロックします。
- ローカルオンボーディングは設定に`gateway.mode="local"`を書き込みます。後で設定ファイルに`gateway.mode`がない場合、それは有効なlocalモードの近道ではなく、設定破損または不完全な手動編集として扱ってください。
- `--allow-unconfigured`は別個のgatewayランタイム用エスケープハッチです。これはオンボーディングが`gateway.mode`を省略してよいことを意味しません。

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

非対話型ローカルgatewayヘルス:

- `--skip-health`を渡さない限り、オンボーディングは到達可能なローカルgatewayを待ってから正常終了します。
- `--install-daemon`は、まず管理対象のgatewayインストールパスを開始します。これがない場合、たとえば`openclaw gateway run`のように、すでにローカルgatewayが動作している必要があります。
- 自動化で設定/ワークスペース/ブートストラップの書き込みだけを行いたい場合は、`--skip-health`を使用してください。
- ネイティブWindowsでは、`--install-daemon`はまずScheduled Tasksを試し、タスク作成が拒否された場合はユーザーごとのStartupフォルダのログイン項目にフォールバックします。

refモードでの対話型オンボーディング動作:

- プロンプトが表示されたら**Use secret reference**を選択します。
- 次に次のいずれかを選びます:
  - Environment variable
  - Configured secret provider（`file`または`exec`）
- オンボーディングは、refを保存する前に高速な事前検証を実行します。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

非対話型Z.AIエンドポイント選択:

注意: `--auth-choice zai-api-key`は、キーに最適なZ.AIエンドポイントを自動検出するようになりました（`zai/glm-5.1`の一般APIを優先）。
GLM Coding Planエンドポイントを明示的に使いたい場合は、`zai-coding-global`または`zai-coding-cn`を選んでください。

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# その他のZ.AIエンドポイント選択:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非対話型Mistralの例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

フローに関する注意:

- `quickstart`: 最小限のプロンプトで、自動的にgatewayトークンを生成します。
- `manual`: ポート/バインド/認証に関する完全なプロンプト（`advanced`のエイリアス）。
- 認証選択が優先プロバイダーを示す場合、オンボーディングはデフォルトモデルと許可リスト選択をそのプロバイダーに事前フィルタリングします。VolcengineとBytePlusでは、これはcoding-planバリアント（`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。
- 優先プロバイダーフィルターでまだ読み込まれたモデルが1つもない場合、オンボーディングは選択肢を空にせず、フィルターなしのカタログにフォールバックします。
- Web検索ステップでは、一部のプロバイダーがプロバイダー固有の追加プロンプトを発生させることがあります。
  - **Grok**では、同じ`XAI_API_KEY`と`x_search`モデル選択を使った任意の`x_search`セットアップを提示できます。
  - **Kimi**では、Moonshot APIリージョン（`api.moonshot.ai`と`api.moonshot.cn`）およびデフォルトのKimi Web検索モデルを尋ねることがあります。
- ローカルオンボーディングのDMスコープ動作: [CLI Setup Reference](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速で最初のチャットを始めるには: `openclaw dashboard`（Control UI、チャネル設定不要）。
- Custom Provider: 一覧にないホスト型プロバイダーを含む、OpenAIまたはAnthropic互換エンドポイントを接続します。自動検出にはUnknownを使用してください。

## よくある後続コマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`は非対話モードを意味しません。スクリプトでは`--non-interactive`を使用してください。
</Note>
