---
read_when:
    - OpenClaw で Fireworks を使いたい場合
    - Fireworks API キー環境変数またはデフォルトモデル ID が必要な場合
summary: Fireworks のセットアップ（認証 + モデル選択）
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T05:14:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) は、OpenAI 互換 API を通じて open-weight モデルと routed モデルを提供します。OpenClaw には、バンドル済みの Fireworks provider Plugin が含まれています。

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI 互換 chat/completions                     |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Default model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## はじめに

<Steps>
  <Step title="オンボーディングで Fireworks 認証を設定する">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    これにより、Fireworks キーが OpenClaw config に保存され、Fire Pass のスターターモデルがデフォルトとして設定されます。

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 非対話の例

スクリプトや CI のセットアップでは、すべての値をコマンドラインで渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 組み込みカタログ

| Model ref                                              | Name                        | Input      | Context | Max output | Notes                                                                                                                                               |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | Fireworks 上の最新 Kimi モデル。Fireworks の K2.6 リクエストでは thinking は無効です。Kimi の thinking 出力が必要なら Moonshot を直接使ってください。 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo（Fire Pass） | text,image | 256,000 | 256,000    | Fireworks 上のデフォルトのバンドル済みスターターモデル                                                                                                          |

<Tip>
Fireworks が新しい Qwen や Gemma リリースのような新しいモデルを公開した場合、バンドル済みカタログの更新を待たずに、その Fireworks モデル id を使って直接切り替えられます。
</Tip>

## カスタム Fireworks モデル ID

OpenClaw は動的な Fireworks モデル ID も受け付けます。Fireworks に表示される正確な model または router id を使い、`fireworks/` を前置してください。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="モデル ID のプレフィックスの仕組み">
    OpenClaw 内のすべての Fireworks モデル参照は、`fireworks/` の後に Fireworks プラットフォーム上の正確な id または router path が続きます。たとえば:

    - Router モデル: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接モデル: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw は API リクエスト構築時に `fireworks/` プレフィックスを取り除き、残りの path を Fireworks endpoint に送信します。

  </Accordion>

  <Accordion title="環境に関する注意">
    Gateway が対話シェル外で動作している場合は、`FIREWORKS_API_KEY` がそのプロセスでも利用可能であることを確認してください。

    <Warning>
    `~/.profile` にだけあるキーは、その環境がそこにも取り込まれていない限り、launchd/systemd デーモンには役立ちません。gateway プロセスが読めるようにするには、`~/.openclaw/.env` または `env.shellEnv` でキーを設定してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選ぶ。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
