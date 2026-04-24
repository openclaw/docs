---
read_when:
    - OpenClawでオープンモデルを無料で使いたい場合
    - '`NVIDIA_API_KEY`の設定が必要な場合'
summary: OpenClawでNVIDIAのOpenAI互換APIを使う
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T05:15:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIAは、オープンモデル向けに`https://integrate.api.nvidia.com/v1`で
OpenAI互換APIを無料提供しています。認証には
[build.nvidia.com](https://build.nvidia.com/settings/api-keys)で取得したAPI keyを使用します。

## はじめに

<Steps>
  <Step title="API keyを取得する">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys)でAPI keyを作成します。
  </Step>
  <Step title="keyをexportしてオンボーディングを実行する">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="NVIDIAモデルを設定する">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
env varの代わりに`--token`を渡すと、その値がshell historyや
`ps`出力に残ります。可能な限り`NVIDIA_API_KEY`環境変数を使ってください。
</Warning>

## 設定例

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 組み込みカタログ

| モデル参照 | 名前 | コンテキスト | 最大出力 |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5 | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5 | 202,752 | 8,192      |

## 高度な設定

<AccordionGroup>
  <Accordion title="自動有効化動作">
    `NVIDIA_API_KEY`環境変数が設定されていると、プロバイダーは自動有効化されます。
    key以外に明示的なプロバイダー設定は不要です。
  </Accordion>

  <Accordion title="カタログと価格">
    バンドルカタログは静的です。NVIDIAは現在、
    一覧にあるモデルへのAPIアクセスを無料提供しているため、source内のコストはデフォルトで`0`です。
  </Accordion>

  <Accordion title="OpenAI互換エンドポイント">
    NVIDIAは標準の`/v1` completionsエンドポイントを使います。OpenAI互換の
    ツールであれば、NVIDIAのbase URLでそのまま動作するはずです。
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIAモデルは現在無料で利用できます。最新の可用性と
レート制限の詳細は[build.nvidia.com](https://build.nvidia.com/)を確認してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、およびフェイルオーバー動作の選び方。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、およびプロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>
