---
read_when:
    - OpenClaw で GLM モデルを使いたい場合
    - モデルの命名規則とセットアップが必要です
summary: GLM モデルファミリーの概要と OpenClaw での使用方法
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T05:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM は、[Z.AI](https://z.ai) プラットフォームから利用できるモデルファミリー（企業ではありません）です。OpenClaw では、GLM モデルは同梱の `zai` プロバイダーを通じて、`zai/glm-5.1` のような参照でアクセスされます。

| プロパティ          | 値                                                                          |
| ------------------- | --------------------------------------------------------------------------- |
| プロバイダー id     | `zai`                                                                       |
| Plugin              | 同梱、`enabledByDefault: true`                                              |
| 認証環境変数        | `ZAI_API_KEY` または `Z_AI_API_KEY`                                         |
| オンボーディング選択肢 | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | OpenAI 互換                                                                |
| デフォルトベース URL | `https://api.z.ai/api/paas/v4`                                              |
| 推奨デフォルト      | `zai/glm-5.1`                                                               |
| デフォルト画像モデル | `zai/glm-4.6v`                                                              |

## はじめに

<Steps>
  <Step title="認証ルートを選んでオンボーディングを実行する">
    Z.AI のプランとリージョンに合うオンボーディング選択肢を選びます。汎用の `zai-api-key` 選択肢は、キーの形状から対応するエンドポイントを自動検出します。特定の Coding Plan または汎用 API サーフェスを強制したい場合は、明示的なリージョン選択肢を使用します。

    | 認証選択肢          | 最適な用途                                            |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | エンドポイント自動検出付きの汎用 API キー              |
    | `zai-coding-global` | Coding Plan ユーザー（グローバル）                    |
    | `zai-coding-cn`     | Coding Plan ユーザー（中国リージョン）                |
    | `zai-global`        | 汎用 API（グローバル）                                |
    | `zai-cn`            | 汎用 API（中国リージョン）                            |

    <CodeGroup>

```bash Auto-detect
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash General API (global)
openclaw onboard --auth-choice zai-global
```

```bash General API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="GLM をデフォルトモデルとして設定する">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## 設定例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` により、OpenClaw はキーの形状から対応する Z.AI エンドポイントを検出し、正しいベース URL を自動的に適用できます。特定の Coding Plan または汎用 API サーフェスに固定したい場合は、明示的なリージョン選択肢を使用します。
</Tip>

## 組み込みカタログ

同梱の `zai` プロバイダーは 13 個の GLM モデル参照をシードします。別途記載がない限り、すべてのエントリは推論をサポートします。`glm-5v-turbo` と `glm-4.6v` はテキストに加えて画像入力も受け付けます。

| モデル参照           | 注記                                               |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | デフォルトモデル。推論、テキストのみ、202k コンテキスト。 |
| `zai/glm-5`          | 推論、テキストのみ、202k コンテキスト。             |
| `zai/glm-5-turbo`    | 推論、テキストのみ、202k コンテキスト。             |
| `zai/glm-5v-turbo`   | 推論、テキスト + 画像、202k コンテキスト。          |
| `zai/glm-4.7`        | 推論、テキストのみ、204k コンテキスト。             |
| `zai/glm-4.7-flash`  | 推論、テキストのみ、200k コンテキスト。             |
| `zai/glm-4.7-flashx` | 推論、テキストのみ。                               |
| `zai/glm-4.6`        | 推論、テキストのみ。                               |
| `zai/glm-4.6v`       | 推論、テキスト + 画像。デフォルト画像モデル。        |
| `zai/glm-4.5`        | 推論、テキストのみ。                               |
| `zai/glm-4.5-air`    | 推論、テキストのみ。                               |
| `zai/glm-4.5-flash`  | 推論、テキストのみ。                               |
| `zai/glm-4.5v`       | 推論、テキスト + 画像。                            |

<Note>
  GLM のバージョンと利用可否は変わることがあります。`openclaw models list --provider zai` を実行して、インストール済みバージョンが認識しているカタログ行を確認し、新しく追加または非推奨になったモデルについては Z.AI のドキュメントを確認してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="エンドポイントの自動検出">
    `zai-api-key` 認証選択肢を使用すると、OpenClaw はキーの形状を検査して正しい Z.AI ベース URL を決定します。明示的なリージョン選択肢（`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`）は自動検出を上書きし、エンドポイントを直接固定します。
  </Accordion>

  <Accordion title="プロバイダーの詳細">
    GLM モデルは `zai` ランタイムプロバイダーによって提供されます。完全なプロバイダー設定、リージョンエンドポイント、追加機能については、[Z.AI プロバイダーページ](/ja-JP/providers/zai) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Z.AI プロバイダー" href="/ja-JP/providers/zai" icon="server">
    完全な Z.AI プロバイダー設定とリージョンエンドポイント。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Thinking モード" href="/ja-JP/tools/thinking" icon="brain">
    推論対応の GLM ファミリー向けの `/think` レベル。
  </Card>
  <Card title="モデル FAQ" href="/ja-JP/help/faq-models" icon="circle-question">
    認証プロファイル、モデルの切り替え、「no profile」エラーの解決。
  </Card>
</CardGroup>
