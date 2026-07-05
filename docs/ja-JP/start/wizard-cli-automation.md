---
read_when:
    - スクリプトまたは CI でオンボーディングを自動化している
    - 特定のプロバイダー向けの非対話型の例が必要です
sidebarTitle: CLI automation
summary: OpenClaw CLI のスクリプト化されたオンボーディングとエージェントセットアップ
title: CLI 自動化
x-i18n:
    generated_at: "2026-07-05T11:48:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9373e7e3815d349e13b98ab68338ff41e8ad3004b49c242acd6c3f8e114f9e3c
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

`openclaw onboard --non-interactive` を使用してセットアップをスクリプト化します。これには `--accept-risk` が必要です。非対話型セットアップでは確認プロンプトなしで認証情報とデーモン設定を書き込めるため、このフラグは明示的なリスク承認です。

<Note>
`--json` は非対話型モードを意味しません。スクリプトでは `--non-interactive --accept-risk` を明示的に渡してください。
</Note>

## ベースラインの非対話型例

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

機械判読可能な概要には `--json` を追加します。

- `--gateway-port` のデフォルトは `18789` です。上書きする場合のみ渡してください。
- `--skip-bootstrap` はデフォルトのワークスペースファイル作成をスキップします。独自のワークスペースを事前投入する自動化向けです。
- `--secret-input-mode ref` は、プレーンテキストキーの代わりに env に基づく参照（`{ source: "env", provider: "default", id: "<ENV_VAR>" }`）を認証プロファイルに保存します。非対話型の `ref` モードでは、プロバイダーの env var がプロセス環境にすでに設定されている必要があります。対応する env var なしでインラインのキーフラグを渡すと即座に失敗します。

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## プロバイダー別の例

<AccordionGroup>
  <Accordion title="Anthropic API キーの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Go カタログでは `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` に切り替えます。
  </Accordion>
  <Accordion title="Synthetic の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI の例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="カスタムプロバイダーの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` は任意です。一部のエンドポイントでは認証が不要です。省略した場合、オンボーディングは env 内の `CUSTOM_API_KEY` を確認します。`--custom-provider-id` は任意で、省略時はベース URL から自動的に導出されます。`--custom-compatibility` のデフォルトは `openai` です（その他の値: `openai-responses`, `anthropic`）。

    OpenClaw は既知のビジョンモデル ID パターン（`gpt-4o`, `claude-3/4`, `gemini`, `-vl`/`vision` サフィックスなど）から画像入力サポートを推論します。認識されないビジョンモデルで強制的に有効化するには `--custom-image-input` を追加し、テキストのみを強制するには `--custom-text-input` を追加します。

    `apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存する ref モードのバリアント:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Anthropic の setup-token 認証は引き続きサポートされていますが、ローカルの Claude CLI ログインが利用可能な場合、OpenClaw は Claude CLI の再利用を優先します。本番環境では Anthropic API キーを推奨します。

## 別のエージェントを追加する

`openclaw agents add <name>` は、独自のワークスペース、セッション、認証プロファイルを持つ別個のエージェントを作成します。`--workspace` なし（かつ他のフラグなし）で実行すると対話型ウィザードが起動します。`--workspace`, `--model`, `--agent-dir`, `--bind`, `--non-interactive` のいずれかを渡すと非対話型で実行され、その場合は `--workspace` が必要になります。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

書き込まれる設定キー（新しいエージェント ID の `agents.list[]` エントリ）:

- `name`
- `workspace`
- `agentDir`
- `model`（`--model` が渡された場合のみ）

注記:

- デフォルトのワークスペース（対話型ウィザードで `--workspace` が省略された場合）: `~/.openclaw/workspace-<agentId>`。
- `--bind <channel[:accountId]>` は繰り返し指定できます。新しいエージェントに受信メッセージをルーティングするためのバインディングを追加します（ウィザードでも対話的に設定できます）。
- エージェント名は有効なエージェント ID に正規化されます。`main` は予約されています。

## 関連ドキュメント

- オンボーディングハブ: [オンボーディング（CLI）](/ja-JP/start/wizard)
- 完全なリファレンス: [CLI セットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- コマンドリファレンス: [`openclaw onboard`](/ja-JP/cli/onboard)
