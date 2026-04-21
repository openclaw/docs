---
read_when:
    - OpenClawでMistralモデルを使いたい場合
    - Mistral APIキーのオンボーディングとモデル参照が必要です
summary: OpenClawでMistralモデルとVoxtral文字起こしを使う
title: Mistral
x-i18n:
    generated_at: "2026-04-21T13:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClawは、テキスト/画像モデルのルーティング（`mistral/...`）と、メディア理解におけるVoxtralによる音声文字起こしの両方でMistralをサポートしています。
Mistralはメモリ埋め込みにも使用できます（`memorySearch.provider = "mistral"`）。

- プロバイダー: `mistral`
- 認証: `MISTRAL_API_KEY`
- API: Mistral Chat Completions（`https://api.mistral.ai/v1`）

## はじめに

<Steps>
  <Step title="APIキーを取得する">
    [Mistral Console](https://console.mistral.ai/) でAPIキーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    または、キーを直接渡します:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="デフォルトモデルを設定する">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 組み込みLLMカタログ

OpenClawには現在、次のMistralカタログが同梱されています:

| Model ref                        | 入力        | コンテキスト | 最大出力   | 備考                                                             |
| -------------------------------- | ----------- | ------------ | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144      | 16,384     | デフォルトモデル                                                 |
| `mistral/mistral-medium-2508`    | text, image | 262,144      | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000      | 16,384     | Mistral Small 4; APIの `reasoning_effort` による推論量の調整が可能 |
| `mistral/pixtral-large-latest`   | text, image | 128,000      | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000      | 4,096      | コーディング                                                     |
| `mistral/devstral-medium-latest` | text        | 262,144      | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000      | 40,000     | 推論対応                                                         |

## 音声文字起こし（Voxtral）

メディア理解パイプラインを通じて、Voxtralを音声文字起こしに使用します。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
メディア文字起こしパスは `/v1/audio/transcriptions` を使用します。Mistralのデフォルト音声モデルは `voxtral-mini-latest` です。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="推論量の調整（mistral-small-latest）">
    `mistral/mistral-small-latest` はMistral Small 4に対応し、Chat Completions APIで `reasoning_effort` を通じた[推論量の調整](https://docs.mistral.ai/capabilities/reasoning/adjustable)をサポートします（`none` は出力内の追加思考を最小化し、`high` は最終回答の前に完全な思考トレースを表示します）。

    OpenClawは、セッションの**thinking**レベルをMistral APIに次のようにマッピングします:

    | OpenClawのthinkingレベル                        | Mistral `reasoning_effort` |
    | ----------------------------------------------- | -------------------------- |
    | **off** / **minimal**                           | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    他の同梱Mistralカタログモデルはこのパラメーターを使いません。Mistral本来の推論優先の挙動が必要な場合は、引き続き `magistral-*` モデルを使用してください。
    </Note>

  </Accordion>

  <Accordion title="メモリ埋め込み">
    Mistralは `/v1/embeddings` を通じてメモリ埋め込みを提供できます（デフォルトモデル: `mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="認証とベースURL">
    - Mistralの認証には `MISTRAL_API_KEY` を使います。
    - プロバイダーのベースURLのデフォルトは `https://api.mistral.ai/v1` です。
    - オンボーディング時のデフォルトモデルは `mistral/mistral-large-latest` です。
    - Z.AIはAPIキーを使ったBearer認証を使用します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、Model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="メディア理解" href="/tools/media-understanding" icon="microphone">
    音声文字起こしのセットアップとプロバイダー選択。
  </Card>
</CardGroup>
