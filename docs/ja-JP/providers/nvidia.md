---
read_when:
    - OpenClawでオープンモデルを無料で使いたい
    - NVIDIA_API_KEY の設定が必要です
summary: OpenClaw で NVIDIA の OpenAI 互換 API を使用する
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T05:31:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIAは、オープンモデル向けにOpenAI互換APIを`https://integrate.api.nvidia.com/v1`で
無料提供しています。[build.nvidia.com](https://build.nvidia.com/settings/api-keys)のAPIキーで
認証します。

## はじめに

<Steps>
  <Step title="APIキーを取得する">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys)でAPIキーを作成します。
  </Step>
  <Step title="キーをエクスポートしてオンボーディングを実行する">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="NVIDIAモデルを設定する">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
env varの代わりに`--nvidia-api-key`を渡すと、その値はシェル履歴と
`ps`出力に残ります。可能な場合は`NVIDIA_API_KEY`環境変数を優先してください。
</Warning>

非対話型セットアップでは、キーを直接渡すこともできます。

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

| モデル参照                                 | 名前                         | コンテキスト | 最大出力   |
| ------------------------------------------ | ---------------------------- | ------------ | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144      | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144      | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608      | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752      | 8,192      |

## 高度な設定

<AccordionGroup>
  <Accordion title="自動有効化の動作">
    `NVIDIA_API_KEY`環境変数が設定されている場合、プロバイダーは自動的に有効化されます。
    キー以外に明示的なプロバイダー設定は不要です。
  </Accordion>

  <Accordion title="カタログと料金">
    バンドルされたカタログは静的です。NVIDIAは現在、掲載モデルの無料APIアクセスを
    提供しているため、ソース内のコストはデフォルトで`0`です。
  </Accordion>

  <Accordion title="OpenAI互換エンドポイント">
    NVIDIAは標準の`/v1` completionsエンドポイントを使用します。OpenAI互換の
    ツールは、NVIDIAのベースURLでそのまま動作するはずです。
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIAモデルは現在無料で使用できます。最新の利用可否と
レート制限の詳細は[build.nvidia.com](https://build.nvidia.com/)で確認してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>
