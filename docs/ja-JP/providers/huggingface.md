---
read_when:
    - OpenClaw で Hugging Face Inference を使用する場合
    - HF トークンの環境変数または CLI 認証の選択が必要です
summary: Hugging Face Inference のセットアップ（認証 + モデル選択）
title: Hugging Face（推論）
x-i18n:
    generated_at: "2026-07-11T22:37:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) は、1つのトークンで多数のホスト型モデル（DeepSeek、Llama など）を利用できる、OpenAI 互換のチャット補完ルーターを提供します。OpenClaw が使用するのは**チャット補完エンドポイントのみ**です。テキストからの画像生成、埋め込み、音声には、[HF 推論クライアント](https://huggingface.co/docs/api-inference/quicktour)を直接使用してください。

| プロパティ       | 値                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| プロバイダー ID  | `huggingface`                                                                                                                    |
| Plugin           | 同梱（デフォルトで有効、インストール手順なし）                                                                                   |
| 認証環境変数     | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`（きめ細かなトークン）                                                                  |
| API              | OpenAI 互換（`https://router.huggingface.co/v1`）                                                                                 |
| 課金             | 1つの HF トークンを使用。[料金](https://huggingface.co/docs/inference-providers/pricing)は無料枠付きでプロバイダーの料金に準拠 |

## はじめに

<Steps>
  <Step title="きめ細かなトークンを作成する">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) に移動し、新しいきめ細かなトークンを作成します。

    <Warning>
    トークンで **Make calls to Inference Providers** 権限を有効にする必要があります。有効でない場合、API リクエストは拒否されます。
    </Warning>

  </Step>
  <Step title="オンボーディングを実行する">
    プロバイダーのドロップダウンで **Hugging Face** を選択し、プロンプトが表示されたら API キーを入力します。

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="デフォルトモデルを選択する">
    **デフォルトの Hugging Face モデル**ドロップダウンでモデルを選択します。トークンが有効な場合、リストは Inference API から読み込まれます。それ以外の場合、OpenClaw は以下の組み込みカタログを表示します。選択内容は `agents.defaults.model.primary` として保存されます。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### 非対話型セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

`huggingface/deepseek-ai/DeepSeek-R1` をデフォルトモデルとして設定します。

## モデル ID

モデル参照は `huggingface/<org>/<model>` の形式（Hub 形式の ID）を使用します。OpenClaw の組み込みカタログは次のとおりです。

| モデル                       | 参照（先頭に `huggingface/` を付加）       |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
トークンが有効な場合、OpenClaw はオンボーディング時と Gateway の起動時に **GET** `https://router.huggingface.co/v1/models` からその他のモデルも検出するため、カタログには上記4つよりはるかに多くのモデルを含めることができます。任意のモデル ID に `:fastest` または `:cheapest` を付加できます。HF のルーターは条件に一致する推論プロバイダーにルーティングします。デフォルトのプロバイダー順序は、[Inference Provider 設定](https://hf.co/settings/inference-providers)で設定します。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="モデル検出とオンボーディングのドロップダウン">
    OpenClaw は次のリクエストでモデルを検出します。

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    レスポンスは OpenAI 形式です：`{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    キー（オンボーディング、`HUGGINGFACE_HUB_TOKEN`、または `HF_TOKEN`）が設定されている場合、対話型セットアップ中の**デフォルトの Hugging Face モデル**ドロップダウンには、このエンドポイントから取得したモデルが表示されます。Gateway の起動時にも同じ呼び出しを繰り返してカタログを更新します。検出されたモデルは、上記の組み込みカタログと統合されます（ID が一致する場合、コンテキストウィンドウやコストなどのメタデータに使用されます）。リクエストが失敗した場合、データが返されなかった場合、またはキーが設定されていない場合、OpenClaw は組み込みカタログのみを使用します。

    プロバイダーを削除せずに検出を無効にするには、次を実行します。

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="モデル名、エイリアス、ポリシー接尾辞">
    - **API から取得する名前：** 検出されたモデルでは、API に `name`、`title`、または `display_name` が存在する場合はそれを使用します。それ以外の場合、OpenClaw はモデル ID から名前を生成します（例：`deepseek-ai/DeepSeek-R1` は「DeepSeek R1」になります）。
    - **表示名の上書き：** 設定でモデルごとにカスタムラベルを指定します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **ポリシー接尾辞：** `:fastest` と `:cheapest` は HF ルーターの規約であり、OpenClaw が書き換えるものではありません。接尾辞はモデル ID の一部としてそのまま送信され、HF のルーターが条件に一致する推論プロバイダーを選択します。接尾辞ごとに個別のエイリアスを使用する場合は、各バリエーションを `models.providers.huggingface.models`（または `model.primary`）の個別のエントリとして追加してください。
    - **設定の統合：** `models.providers.huggingface.models`（例：`models.json` 内）の既存エントリは設定の統合時に保持されるため、そこで指定したカスタムの `name`、`alias`、またはモデルオプションは再起動後も維持されます。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway をデーモン（launchd/systemd）として実行する場合は、そのプロセスから `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` を利用できるようにしてください（たとえば、`~/.openclaw/.env` または `env.shellEnv` を使用します）。

    <Note>
    OpenClaw は `HUGGINGFACE_HUB_TOKEN` と `HF_TOKEN` の両方を受け付けます。両方が設定されている場合は、`HUGGINGFACE_HUB_TOKEN` が優先されます。
    </Note>

  </Accordion>

  <Accordion title="設定：フォールバック付きの DeepSeek R1">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：最安・最速バリエーション付きの DeepSeek">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="設定：エイリアス付きの DeepSeek + Llama + GPT-OSS">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/models" icon="brain">
    モデルを選択して設定する方法。
  </Card>
  <Card title="Inference Providers ドキュメント" href="https://huggingface.co/docs/inference-providers" icon="book">
    Hugging Face Inference Providers の公式ドキュメント。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
