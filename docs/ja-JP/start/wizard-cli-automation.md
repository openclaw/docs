---
read_when:
    - スクリプトまたはCIでオンボーディングを自動化している場合
    - 特定のプロバイダー向けの非対話型の例が必要です
sidebarTitle: CLI automation
summary: OpenClaw CLI のスクリプト化されたオンボーディングとエージェント設定
title: CLI 自動化
x-i18n:
    generated_at: "2026-07-11T22:43:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

セットアップをスクリプト化するには、`openclaw onboard --non-interactive` を使用します。`--accept-risk` は必須です。非対話型セットアップでは確認プロンプトなしで認証情報とデーモン設定を書き込めるため、このフラグによってリスクを明示的に承認します。

<Note>
`--json` を指定しても非対話型モードにはなりません。スクリプトでは `--non-interactive --accept-risk` を明示的に渡してください。
</Note>

## 基本的な非対話型の例

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

機械可読な概要を出力するには、`--json` を追加します。

- `--gateway-port` のデフォルトは `18789` です。変更する場合にのみ指定してください。
- `--skip-bootstrap` は、デフォルトのワークスペースファイルの作成をスキップします。独自のワークスペースを事前に用意する自動化に使用します。
- `--secret-input-mode ref` は、平文のキーの代わりに環境変数を参照する参照値（`{ source: "env", provider: "default", id: "<ENV_VAR>" }`）を認証プロファイルに保存します。非対話型の `ref` モードでは、プロバイダーの環境変数がプロセス環境にあらかじめ設定されている必要があります。対応する環境変数を設定せずにインラインのキーフラグを渡すと、即座に失敗します。

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## プロバイダー別の例

<AccordionGroup>
  <Accordion title="Anthropic APIキーの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gatewayの例">
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
  <Accordion title="Geminiの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistralの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshotの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollamaの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCodeの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Goカタログを使用する場合は、`--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` に置き換えます。
  </Accordion>
  <Accordion title="Syntheticの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gatewayの例">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AIの例">
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

    `--custom-api-key` は省略可能です。認証を必要としないエンドポイントもあります。省略した場合、オンボーディングは環境内の `CUSTOM_API_KEY` を確認します。`--custom-provider-id` は省略可能で、省略するとベースURLから自動的に導出されます。`--custom-compatibility` のデフォルトは `openai` です（その他の値：`openai-responses`、`anthropic`）。

    OpenClawは、既知のビジョンモデルIDのパターン（`gpt-4o`、`claude-3/4`、`gemini`、`-vl`/`vision` サフィックスなど）から画像入力のサポートを推測します。認識されないビジョンモデルで画像入力を強制的に有効にするには `--custom-image-input` を追加し、テキストのみを強制するには `--custom-text-input` を追加します。

    `apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存する、参照モードの例：

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

Anthropicのセットアップトークン認証は引き続きサポートされますが、ローカルのClaude CLIでログイン済みの場合、OpenClawはClaude CLIの再利用を優先します。本番環境では、Anthropic APIキーを推奨します。

## 別のエージェントを追加する

`openclaw agents add <name>` は、独自のワークスペース、セッション、認証プロファイルを持つ別個のエージェントを作成します。`--workspace` もその他のフラグも指定せずに実行すると、対話型ウィザードが起動します。`--workspace`、`--model`、`--agent-dir`、`--bind`、`--non-interactive` のいずれかを渡すと非対話型で実行され、その場合は `--workspace` が必須です。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

書き込まれる設定キー（新しいエージェントIDの `agents.list[]` エントリ）：

- `name`
- `workspace`
- `agentDir`
- `model`（`--model` を渡した場合のみ）

注記：

- デフォルトのワークスペース（対話型ウィザードで `--workspace` を省略した場合）：`~/.openclaw/workspace-<agentId>`。
- `--bind <channel[:accountId]>` は複数回指定できます。新しいエージェントへ受信メッセージをルーティングするためのバインディングを追加します（ウィザードでも対話形式で設定できます）。
- エージェント名は有効なエージェントIDに正規化されます。`main` は予約済みです。

## 関連ドキュメント

- オンボーディングハブ：[オンボーディング（CLI）](/ja-JP/start/wizard)
- 完全なリファレンス：[CLIセットアップリファレンス](/ja-JP/start/wizard-cli-reference)
- コマンドリファレンス：[`openclaw onboard`](/ja-JP/cli/onboard)
