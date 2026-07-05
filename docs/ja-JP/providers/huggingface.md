---
read_when:
    - OpenClawでHugging Face Inferenceを使いたい
    - HF トークンの環境変数または CLI 認証の選択が必要です
summary: Hugging Face Inference のセットアップ（認証 + モデル選択）
title: Hugging Face (推論)
x-i18n:
    generated_at: "2026-07-05T11:44:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) は、1つのトークンで多数のホスト済みモデル (DeepSeek、Llama など) の前段に OpenAI 互換のチャット補完ルーターを公開します。OpenClaw は**チャット補完エンドポイントのみ**と通信します。text-to-image、embeddings、speech には [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) を直接使用してください。

| プロパティ     | 値                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Provider id  | `huggingface`                                                                                                               |
| Plugin       | バンドル済み (デフォルトで有効、インストール手順なし)                                                                               |
| Auth env var | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` (fine-grained token)                                                                  |
| API          | OpenAI 互換 (`https://router.huggingface.co/v1`)                                                                      |
| Billing      | 単一の HF トークン。[pricing](https://huggingface.co/docs/inference-providers/pricing) は無料枠付きでプロバイダー料金に従います |

## はじめに

<Steps>
  <Step title="fine-grained token を作成する">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) に移動し、新しい fine-grained token を作成します。

    <Warning>
    トークンには **Make calls to Inference Providers** 権限を有効にしておく必要があります。有効でない場合、API リクエストは拒否されます。
    </Warning>

  </Step>
  <Step title="オンボーディングを実行する">
    プロバイダーのドロップダウンで **Hugging Face** を選択し、プロンプトが表示されたら API キーを入力します。

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="デフォルトモデルを選択する">
    **Default Hugging Face model** ドロップダウンでモデルを選択します。トークンが有効な場合、リストは Inference API から読み込まれます。それ以外の場合、OpenClaw は下記の組み込みカタログを表示します。選択内容は `agents.defaults.model.primary` として保存されます。

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
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### 非対話セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

`huggingface/deepseek-ai/DeepSeek-R1` をデフォルトモデルとして設定します。

## モデル ID

モデル参照は `huggingface/<org>/<model>` (Hub 形式の ID) の形式を使用します。OpenClaw の組み込みカタログ:

| モデル                        | 参照 (`huggingface/` をプレフィックスとして付ける)          |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
トークンが有効な場合、OpenClaw はオンボーディング時と Gateway 起動時に **GET** `https://router.huggingface.co/v1/models` から他のモデルも検出するため、カタログには上記4つのモデルよりはるかに多くを含められます。任意のモデル ID に `:fastest` または `:cheapest` を付加できます。HF のルーターは一致する inference provider にルーティングします。デフォルトのプロバイダー順序は [Inference Provider settings](https://hf.co/settings/inference-providers) で設定します。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="モデル検出とオンボーディングのドロップダウン">
    OpenClaw は次の方法でモデルを検出します。

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    レスポンスは OpenAI 形式です: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`。

    設定済みキー (オンボーディング、`HUGGINGFACE_HUB_TOKEN`、または `HF_TOKEN`) がある場合、対話セットアップ中の **Default Hugging Face model** ドロップダウンはこのエンドポイントから入力されます。Gateway 起動時にも同じ呼び出しを繰り返し、カタログを更新します。検出されたモデルは上記の組み込みカタログとマージされます (ID が一致する場合、コンテキストウィンドウやコストなどのメタデータに使用されます)。リクエストが失敗した場合、データが返らない場合、またはキーが設定されていない場合、OpenClaw は組み込みカタログのみにフォールバックします。

    プロバイダーを削除せずに検出を無効にします。

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="モデル名、エイリアス、ポリシーサフィックス">
    - **API からの名前:** 検出されたモデルは、存在する場合 API の `name`、`title`、または `display_name` を使用します。それ以外の場合、OpenClaw はモデル ID から名前を導出します (例: `deepseek-ai/DeepSeek-R1` は「DeepSeek R1」になります)。
    - **表示名を上書きする:** config でモデルごとにカスタムラベルを設定します。

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

    - **ポリシーサフィックス:** `:fastest` と `:cheapest` は HF ルーターの規約であり、OpenClaw が書き換えるものではありません。サフィックスはモデル ID の一部としてそのまま送信され、HF のルーターが一致する inference provider を選択します。サフィックスごとに個別のエイリアスが必要な場合は、各バリアントを `models.providers.huggingface.models` の下 (または `model.primary` 内) に独自のエントリとして追加します。
    - **Config のマージ:** `models.providers.huggingface.models` の既存エントリ (例: `models.json`) は config マージ時に保持されるため、そこで設定したカスタム `name`、`alias`、またはモデルオプションは再起動後も維持されます。

  </Accordion>

  <Accordion title="環境とデーモンのセットアップ">
    Gateway をデーモン (launchd/systemd) として実行する場合は、`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` がそのプロセスで利用できることを確認してください (たとえば、`~/.openclaw/.env` または `env.shellEnv` 経由)。

    <Note>
    OpenClaw は `HUGGINGFACE_HUB_TOKEN` と `HF_TOKEN` の両方を受け付けます。両方が設定されている場合、`HUGGINGFACE_HUB_TOKEN` が優先されます。
    </Note>

  </Accordion>

  <Accordion title="Config: フォールバック付き DeepSeek R1">
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

  <Accordion title="Config: cheapest と fastest バリアント付き DeepSeek">
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

  <Accordion title="Config: エイリアス付き DeepSeek + Llama + GPT-OSS">
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

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選択と設定方法。
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    公式の Hugging Face Inference Providers ドキュメント。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な config リファレンス。
  </Card>
</CardGroup>
