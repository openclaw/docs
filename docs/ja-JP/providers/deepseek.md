---
read_when:
    - OpenClawでDeepSeekを使いたい場合
    - API keyのenv varまたはCLI auth choiceが必要な場合
summary: DeepSeekのセットアップ（auth + model選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T05:14:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) は、OpenAI互換APIを持つ強力なAIモデルを提供します。

| Property | Value                      |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| Auth     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI互換                 |
| Base URL | `https://api.deepseek.com` |

## はじめに

<Steps>
  <Step title="API keyを取得する">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) でAPI keyを作成してください。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    これによりAPI keyの入力を求められ、デフォルトmodelとして `deepseek/deepseek-chat` が設定されます。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非対話セットアップ">
    スクリプト化またはheadlessなインストールでは、すべてのflagを直接渡してください:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gatewayがdaemon（launchd/systemd）として動作する場合、`DEEPSEEK_API_KEY`
がそのprocessで利用可能であることを確認してください（たとえば `~/.openclaw/.env` や
`env.shellEnv` 経由）。
</Warning>

## 組み込みcatalog

| Model ref                    | Name              | Input | Context | Max output | 注記                                               |
| ---------------------------- | ----------------- | ----- | ------- | ---------- | -------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192      | デフォルトmodel; DeepSeek V3.2のnon-thinkingサーフェス |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536     | reasoning有効なV3.2サーフェス                      |

<Tip>
現在、両方の同梱modelはsource上でstreaming usage compatibilityを広告しています。
</Tip>

## Config例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover動作の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    agent、model、provider向けの完全なconfigリファレンス。
  </Card>
</CardGroup>
