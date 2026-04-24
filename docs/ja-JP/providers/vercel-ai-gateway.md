---
read_when:
    - OpenClaw で Vercel AI Gateway を使いたい場合
    - API key の環境変数または CLI の auth choice が必要な場合
summary: Vercel AI Gateway のセットアップ（認証 + モデル選択）
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T05:17:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

[Vercel AI Gateway](https://vercel.com/ai-gateway) は、単一の endpoint を通じて数百のモデルにアクセスできる統一 API を提供します。

| Property | 値 |
| ------------- | -------------------------------- |
| Provider | `vercel-ai-gateway` |
| Auth | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages 互換 |
| モデルカタログ | `/v1/models` 経由で自動検出 |

<Tip>
OpenClaw は Gateway の `/v1/models` カタログを自動検出するため、
`/models vercel-ai-gateway` には
`vercel-ai-gateway/openai/gpt-5.5` や
`vercel-ai-gateway/moonshotai/kimi-k2.6` のような最新 model ref が含まれます。
</Tip>

## はじめに

<Steps>
  <Step title="API key を設定する">
    オンボーディングを実行し、AI Gateway auth オプションを選んでください。

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="デフォルトモデルを設定する">
    OpenClaw config にモデルを追加します。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非対話型の例

スクリプト化または CI セットアップでは、すべての値をコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## モデル ID の shorthand

OpenClaw は Vercel Claude の shorthand model ref を受け付け、ランタイムで正規化します。

| shorthand 入力 | 正規化される model ref |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
設定では shorthand でも完全修飾 model ref でも使えます。
OpenClaw が正規形を自動解決します。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="daemon プロセス用の環境変数">
    OpenClaw Gateway が daemon（launchd/systemd）として動作している場合、
    `AI_GATEWAY_API_KEY` がそのプロセスから利用可能であることを確認してください。

    <Warning>
    `~/.profile` にだけ設定された key は、明示的にその環境をインポートしない限り launchd/systemd
    daemon からは見えません。gateway プロセスが
    それを読めるようにするには、key を `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

  </Accordion>

  <Accordion title="provider ルーティング">
    Vercel AI Gateway は、model
    ref prefix に基づいて上流 provider へリクエストをルーティングします。たとえば、`vercel-ai-gateway/anthropic/claude-opus-4.6` は
    Anthropic 経由、`vercel-ai-gateway/openai/gpt-5.5` は
    OpenAI 経由、`vercel-ai-gateway/moonshotai/kimi-k2.6` は
    MoonshotAI 経由にルーティングされます。単一の `AI_GATEWAY_API_KEY` が、すべての
    上流 provider に対する認証を処理します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
