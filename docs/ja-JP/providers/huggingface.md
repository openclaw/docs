---
read_when:
    - OpenClaw で Hugging Face Inference を使いたい場合
    - HF token の env var または CLI 認証選択が必要な場合
summary: Hugging Face Inference のセットアップ（認証 + モデル選択）
title: Hugging Face（inference）
x-i18n:
    generated_at: "2026-04-24T05:15:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) は、単一のルーター API を通じて OpenAI 互換の chat completions を提供します。1 つの token で多数のモデル（DeepSeek、Llama など）にアクセスできます。OpenClaw は **OpenAI 互換エンドポイント**（chat completions のみ）を使います。text-to-image、embeddings、speech には、代わりに [HF inference clients](https://huggingface.co/docs/api-inference/quicktour) を直接使ってください。

- プロバイダ: `huggingface`
- 認証: `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`（**Make calls to Inference Providers** 権限を持つ fine-grained token）
- API: OpenAI 互換（`https://router.huggingface.co/v1`）
- 課金: 単一の HF token。[pricing](https://huggingface.co/docs/inference-providers/pricing) は free tier 付きで provider 料金に従います。

## はじめに

<Steps>
  <Step title="fine-grained token を作成">
    [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) にアクセスし、新しい fine-grained token を作成してください。

    <Warning>
    token には **Make calls to Inference Providers** 権限が有効になっている必要があります。そうでないと API リクエストは拒否されます。
    </Warning>

  </Step>
  <Step title="オンボーディングを実行">
    プロバイダのドロップダウンで **Hugging Face** を選び、求められたら API キーを入力してください:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="デフォルトモデルを選ぶ">
    **Default Hugging Face model** ドロップダウンで、使いたいモデルを選んでください。有効な token がある場合は Inference API から一覧が読み込まれ、そうでなければ組み込み一覧が表示されます。選択内容はデフォルトモデルとして保存されます。

    後から config でデフォルトモデルを設定または変更することもできます:

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
  <Step title="モデルが利用可能か確認">
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

これにより `huggingface/deepseek-ai/DeepSeek-R1` がデフォルトモデルとして設定されます。

## モデル ID

モデル参照は `huggingface/<org>/<model>` 形式（Hub 形式 ID）です。以下の一覧は **GET** `https://router.huggingface.co/v1/models` に基づくものです。あなたのカタログにはさらに多く含まれている場合があります。

| モデル                 | 参照（`huggingface/` を先頭に付ける） |
| ---------------------- | ------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`             |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`           |
| Qwen3 8B               | `Qwen/Qwen3-8B`                       |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`            |
| Qwen3 32B              | `Qwen/Qwen3-32B`                      |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`   |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`    |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                 |
| GLM 4.7                | `zai-org/GLM-4.7`                     |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                |

<Tip>
どのモデル ID にも `:fastest` または `:cheapest` を付けられます。デフォルト順序は [Inference Provider settings](https://hf.co/settings/inference-providers) で設定してください。完全一覧は [Inference Providers](https://huggingface.co/docs/inference-providers) と **GET** `https://router.huggingface.co/v1/models` を参照してください。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="モデル検出とオンボーディングのドロップダウン">
    OpenClaw は **Inference エンドポイントを直接呼び出して** モデルを検出します:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    （任意: 完全一覧を得るには `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` または `$HF_TOKEN` を送ってください。一部エンドポイントは認証なしだと部分集合しか返しません。）レスポンスは OpenAI 形式の `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` です。

    Hugging Face API キー（オンボーディング、`HUGGINGFACE_HUB_TOKEN`、または `HF_TOKEN` 経由）を設定すると、OpenClaw はこの GET を使って利用可能な chat-completion モデルを検出します。**対話セットアップ** 中では、token を入力した後に **Default Hugging Face model** ドロップダウンが表示され、この一覧（またはリクエスト失敗時は組み込みカタログ）から埋められます。ランタイム中（たとえば Gateway 起動時）も、キーが存在すれば OpenClaw は再び **GET** `https://router.huggingface.co/v1/models` を呼び出してカタログを更新します。この一覧は、組み込みカタログ（コンテキストウィンドウやコストなどのメタデータ用）とマージされます。リクエストが失敗した場合、またはキーが設定されていない場合は、組み込みカタログのみが使われます。

  </Accordion>

  <Accordion title="モデル名、エイリアス、ポリシーサフィックス">
    - **API 由来の名前:** モデル表示名は、API が `name`, `title`, `display_name` を返した場合、それを **GET /v1/models** から hydrate します。そうでない場合はモデル ID から導出されます（例: `deepseek-ai/DeepSeek-R1` は「DeepSeek R1」になります）。
    - **表示名を上書き:** config でモデルごとにカスタムラベルを設定すると、CLI や UI 上で好きな表示名にできます:

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

    - **ポリシーサフィックス:** OpenClaw の同梱 Hugging Face ドキュメントと helper は現在、この 2 つのサフィックスを組み込みポリシーバリアントとして扱います:
      - **`:fastest`** — 最大スループット
      - **`:cheapest`** — 出力トークン単価が最安

      これらは `models.providers.huggingface.models` に別エントリとして追加することも、`model.primary` にサフィックス付きで設定することもできます。デフォルトの provider 順序は [Inference Provider settings](https://hf.co/settings/inference-providers) でも設定できます（サフィックスなし = その順序を使う）。

    - **Config merge:** `models.providers.huggingface.models` 内の既存エントリ（例: `models.json` 内）は、config マージ時に保持されます。そのため、そこに設定したカスタム `name`, `alias`, またはモデルオプションは保持されます。

  </Accordion>

  <Accordion title="環境と daemon セットアップ">
    Gateway を daemon（launchd / systemd）として動かす場合、`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` がそのプロセスから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。

    <Note>
    OpenClaw は `HUGGINGFACE_HUB_TOKEN` と `HF_TOKEN` の両方を env var エイリアスとして受け付けます。どちらでも動作します。両方が設定されている場合は `HUGGINGFACE_HUB_TOKEN` が優先されます。
    </Note>

  </Accordion>

  <Accordion title="Config: Qwen fallback 付き DeepSeek R1">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: cheapest と fastest バリアント付き Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
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
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: ポリシーサフィックス付き複数の Qwen と DeepSeek">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
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
    すべてのプロバイダ、モデル参照、failover 動作の概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    公式 Hugging Face Inference Providers ドキュメント。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
