---
read_when:
    - OpenClawでオープンモデルを無料で使いたい
    - NVIDIA_API_KEY の設定が必要です
    - NVIDIA 経由で Nemotron 3 Ultra を使用したい場合
summary: OpenClaw で NVIDIA の OpenAI 互換 API を使用する
title: NVIDIA
x-i18n:
    generated_at: "2026-07-05T11:45:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3300395fdaf9baf22476f9b4d5a5b217ddab1aa10042c5959ffa059c3a258de4
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA は、OpenAI互換 API `https://integrate.api.nvidia.com/v1` を通じてオープンモデルを無料で提供しています。認証には [build.nvidia.com](https://build.nvidia.com/settings/api-keys) で取得した API キーを使用します。OpenClaw は NVIDIA provider のデフォルトを Nemotron 3 Ultra に設定します。これは、長いコンテキストのエージェント型作業向けに NVIDIA が提供する、総パラメータ数 550B / アクティブ推論 55B のモデルです。

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [build.nvidia.com](https://build.nvidia.com/settings/api-keys) で API キーを作成します。
  </Step>
  <Step title="キーをエクスポートしてオンボーディングを実行する">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="NVIDIA モデルを設定する">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

非対話型セットアップでは、キーを直接渡します。

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` はキーをシェル履歴と `ps` 出力に残します。可能な場合は `NVIDIA_API_KEY` 環境変数を優先してください。
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## 注目カタログ

NVIDIA API キーが設定されている場合、セットアップとモデル選択のパスは NVIDIA の公開注目モデルカタログを `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` から取得し、結果を 24 時間キャッシュします（先頭 32 件を自由テキスト入力行としてインポート）。そのため、build.nvidia.com の新しい注目モデルは、OpenClaw のリリースを待たずにセットアップとモデル選択の画面に表示されます。ライブフィードが利用可能な場合、最初に返されたモデルが NVIDIA セットアップ中の事前選択オプションになります。

この取得では、`assets.ngc.nvidia.com` に対して固定の HTTPS ホストポリシーを使用します。NVIDIA API キーが設定されていない場合、またはフィードが利用できないか不正な形式の場合、OpenClaw は同梱カタログと以下の同梱デフォルトにフォールバックします。

## Nemotron 3 Ultra

Nemotron 3 Ultra は OpenClaw のデフォルト NVIDIA モデルです。[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) の NVIDIA build ページでは、1M トークンのコンテキスト仕様を持つ利用可能な無料エンドポイントとして記載されています。同梱カタログでは、ホストされたエンドポイント向けの NVIDIA の現在の OpenAI互換サンプルリクエストに合わせて、最大出力を 16,384 トークンとして記録しています。

同梱の Ultra 行は、通常のチャット出力が推論テキストを露出せずに表示回答内に収まるように、デフォルトで `chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }` を送信します。

最高性能の NVIDIA デフォルトには Ultra を使用します。より小さい Nemotron 3 オプションが必要な場合は Super を選択したままにするか、コンテキスト、レイテンシ、または挙動がより適している場合は NVIDIA のカタログでホストされているサードパーティモデルのいずれかを選択してください。

## 同梱フォールバックカタログ

| モデル参照                               | 名前                         | コンテキスト | 最大出力 | メモ                                     |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | ---------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | デフォルト                               |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      |                                          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      |                                          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      |                                          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      |                                          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 非推奨。`minimaxai/minimax-m2.7` を使用 |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 非推奨。`z-ai/glm-5.1` を使用           |

## 高度な設定

<AccordionGroup>
  <Accordion title="自動有効化の挙動">
    `NVIDIA_API_KEY` 環境変数が設定されている場合、またはオンボーディング中にキーが保存された場合、provider は自動的に有効化されます。キー以外に明示的な provider 設定は必要ありません。
  </Accordion>

  <Accordion title="カタログと価格">
    NVIDIA 認証が設定されている場合、OpenClaw は NVIDIA の公開注目モデルカタログを優先し、24 時間キャッシュします。同梱フォールバックカタログは静的で、アップグレード互換性のために非推奨の出荷済み参照を保持します。NVIDIA は現在、記載されたモデルに無料 API アクセスを提供しているため、ソース内のコストはデフォルトで `0` です。
  </Accordion>

  <Accordion title="OpenAI互換エンドポイント">
    OpenClaw は、標準の `/v1` チャット補完ルートに対して `openai-completions` アダプターを使用して NVIDIA と通信します。OpenAI互換ツールは、NVIDIA ベース URL でそのまま動作するはずです。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra の推論パラメータ">
    NVIDIA の Ultra サンプルリクエストは、推論出力に `chat_template_kwargs.enable_thinking` と `reasoning_budget` を使用します。OpenClaw の同梱 Ultra 行は、通常のチャット利用向けにデフォルトでテンプレート思考を無効にしています。NVIDIA の推論出力を有効にする必要がある場合、または他の NVIDIA 固有のリクエストフィールドを強制する必要がある場合は、モデル単位のパラメータを設定し、provider 固有のオーバーライドを NVIDIA モデルに限定してください。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` は、リクエスト上にすでにある `chat_template_kwargs` 全体を置き換えるのではなく、そこへマージされます。`params.extra_body` は最終的な OpenAI互換リクエスト本文のオーバーライドであり、衝突するペイロードキーを上書きするため、選択したエンドポイントについて NVIDIA が文書化しているフィールドにのみ使用してください。

  </Accordion>

  <Accordion title="遅いカスタム provider 応答">
    NVIDIA でホストされる一部のカスタムモデルは、最初の応答チャンクを出力するまでに、デフォルトの約 120 秒のモデルアイドル watchdog より長くかかる場合があります。カスタム NVIDIA provider エントリでは、agent ランタイム全体のタイムアウトではなく provider タイムアウトを引き上げてください。`timeoutSeconds` は provider の HTTP リクエストを対象とし、その provider のアイドル/ストリーム watchdog 上限を引き上げます。

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA モデルは現在無料で利用できます。最新の提供状況とレート制限の詳細は [build.nvidia.com](https://build.nvidia.com/) を確認してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    agent、モデル、provider の完全な設定リファレンス。
  </Card>
</CardGroup>
