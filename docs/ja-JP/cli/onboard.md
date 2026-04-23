---
read_when:
    - Gateway、workspace、auth、チャネル、Skillsのガイド付きセットアップを行いたい場合
summary: '`openclaw onboard` のCLIリファレンス（対話型オンボーディング）'
title: onboard
x-i18n:
    generated_at: "2026-04-23T14:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

ローカルまたはリモートのGatewayセットアップ向けの対話型オンボーディングです。

## 関連ガイド

- CLIオンボーディングハブ: [オンボーディング (CLI)](/ja-JP/start/wizard)
- オンボーディング概要: [オンボーディング概要](/ja-JP/start/onboarding-overview)
- CLIオンボーディングリファレンス: [CLIセットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- CLI自動化: [CLI自動化](/ja-JP/start/wizard-cli-automation)
- macOSオンボーディング: [オンボーディング (macOS App)](/ja-JP/start/onboarding)

## 例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

平文のプライベートネットワーク `ws://` ターゲットを使う場合（信頼できるネットワークのみ）、オンボーディングプロセスの環境で
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

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

`--custom-api-key` は非対話モードでは任意です。省略した場合、オンボーディングは `CUSTOM_API_KEY` を確認します。

LM Studioも、非対話モードでプロバイダー固有のキーフラグをサポートします。

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

`--custom-base-url` のデフォルトは `http://127.0.0.1:11434` です。`--custom-model-id` は任意で、省略した場合はオンボーディングがOllamaの推奨デフォルトを使用します。`kimi-k2.5:cloud` のようなクラウドmodel IDもここで使用できます。

プロバイダーキーを平文ではなくrefとして保存する:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使うと、オンボーディングは平文のキー値の代わりにenvバックのrefを書き込みます。
auth-profileバックのプロバイダーでは `keyRef` エントリを書き込みます。カスタムプロバイダーでは、`models.providers.<id>.apiKey` をenv refとして書き込みます（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）。

非対話型 `ref` モードの契約:

- オンボーディングプロセス環境で、そのプロバイダーの環境変数を設定してください（例: `OPENAI_API_KEY`）。
- 対応する環境変数も設定されていない限り、インラインのキーフラグ（例: `--openai-api-key`）を渡さないでください。
- 必須の環境変数なしでインラインのキーフラグを渡した場合、オンボーディングはガイダンス付きで即座に失敗します。

非対話モードでのGateway tokenオプション:

- `--gateway-auth token --gateway-token <token>` は平文tokenを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` をenv SecretRefとして保存します。
- `--gateway-token` と `--gateway-token-ref-env` は同時に使用できません。
- `--gateway-token-ref-env` には、オンボーディングプロセス環境内の空でない環境変数が必要です。
- `--install-daemon` 使用時、token authにtokenが必要な場合、SecretRef管理のgateway tokenは検証されますが、supervisorサービス環境メタデータに解決済み平文として永続化はされません。
- `--install-daemon` 使用時、token modeでtokenが必要で、設定されたtoken SecretRefが未解決なら、オンボーディングは修正手順付きでクローズドフェイルします。
- `--install-daemon` 使用時、`gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定の場合、modeが明示的に設定されるまでオンボーディングはインストールをブロックします。
- ローカルオンボーディングは `gateway.mode="local"` をconfigに書き込みます。後のconfigファイルで `gateway.mode` が欠けている場合、それは有効なlocal modeのショートカットではなく、config破損または不完全な手動編集として扱ってください。
- `--allow-unconfigured` は別のGatewayランタイム用エスケープハッチです。これはオンボーディングで `gateway.mode` を省略してよいことを意味しません。

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

非対話型ローカルGatewayヘルス:

- `--skip-health` を渡さない限り、オンボーディングは到達可能なローカルGatewayを待ってから正常終了します。
- `--install-daemon` はまず管理対象Gatewayインストール経路を開始します。これを付けない場合、たとえば `openclaw gateway run` のように、すでにローカルGatewayが動作している必要があります。
- 自動化でconfig/workspace/bootstrapの書き込みだけを行いたい場合は、`--skip-health` を使用してください。
- ネイティブWindowsでは、`--install-daemon` はまずScheduled Tasksを試し、タスク作成が拒否された場合はユーザー単位のStartupフォルダーlogin itemにフォールバックします。

refモードでの対話型オンボーディング動作:

- プロンプトが表示されたら **Use secret reference** を選びます。
- 次に以下のいずれかを選びます:
  - Environment variable
  - Configured secret provider（`file` または `exec`）
- オンボーディングはrefを保存する前に高速な事前検証を行います。
  - 検証に失敗した場合、オンボーディングはエラーを表示し、再試行できます。

非対話型Z.AIエンドポイントの選択肢:

注: `--auth-choice zai-api-key` は、あなたのキーに最適なZ.AIエンドポイントを自動検出するようになりました（`zai/glm-5.1` を使う一般APIを優先）。
GLM Coding Planエンドポイントを明示的に使いたい場合は、`zai-coding-global` または `zai-coding-cn` を選んでください。

```bash
# プロンプトなしのエンドポイント選択
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# その他のZ.AIエンドポイント選択肢:
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

フローに関する注記:

- `quickstart`: 最小限のプロンプトで、gateway tokenを自動生成します。
- `manual`: port/bind/authの完全なプロンプトを表示します（`advanced` の別名）。
- auth choiceが優先プロバイダーを示す場合、オンボーディングは
  デフォルトmodelとallowlistのピッカーをそのプロバイダーに事前フィルタリングします。Volcengineと
  BytePlusでは、coding planバリアント
  （`volcengine-plan/*`、`byteplus-plan/*`）にも一致します。
- 優先プロバイダーフィルターでまだ読み込み済みmodelが1つもない場合、オンボーディングは
  ピッカーを空のままにせず、フィルターなしカタログにフォールバックします。
- web-searchステップでは、一部のプロバイダーでプロバイダー固有の
  追加プロンプトが出る場合があります:
  - **Grok** では、同じ `XAI_API_KEY` と
    `x_search` model選択を使う任意の `x_search` セットアップを提示することがあります。
  - **Kimi** では、Moonshot APIリージョン（`api.moonshot.ai` または
    `api.moonshot.cn`）と、デフォルトのKimi web-search modelを尋ねることがあります。
- ローカルオンボーディングのDMスコープ動作: [CLIセットアップリファレンス](/ja-JP/start/wizard-cli-reference#outputs-and-internals)。
- 最速の初回チャット: `openclaw dashboard`（Control UI、チャネルセットアップ不要）。
- Custom Provider: 一覧にないホスト型プロバイダーを含む、任意のOpenAIまたはAnthropic互換エンドポイントを接続できます。自動検出するには Unknown を使用してください。

## よく使う後続コマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` を使用してください。
</Note>
