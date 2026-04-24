---
read_when:
    - OpenClaw で Tencent Hy3 preview を使いたい場合
    - TokenHub API キーのセットアップが必要な場合
summary: Hy3 preview 向け Tencent Cloud TokenHub のセットアップ
title: Tencent Cloud（TokenHub）
x-i18n:
    generated_at: "2026-04-24T05:17:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud は OpenClaw で **バンドル済み provider Plugin** として提供されます。これにより、TokenHub endpoint（`tencent-tokenhub`）経由で Tencent Hy3 preview にアクセスできます。

この provider は OpenAI 互換 API を使用します。

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| Default model | `tencent-tokenhub/hy3-preview`             |
| Auth          | `TOKENHUB_API_KEY`                         |
| API           | OpenAI 互換 chat completions         |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| Global URL    | `https://tokenhub-intl.tencentmaas.com/v1` |

## クイックスタート

<Steps>
  <Step title="TokenHub API キーを作成する">
    Tencent Cloud TokenHub で API キーを作成します。キーに制限付きアクセススコープを選ぶ場合は、許可モデルに **Hy3 preview** を含めてください。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="モデルを確認する">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## 非対話セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## 組み込みカタログ

| Model ref                      | Name                   | Input | Context | Max output | Notes                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview（TokenHub） | text  | 256,000 | 64,000     | デフォルト。reasoning 有効 |

Hy3 preview は Tencent Hunyuan の大規模 MoE 言語モデルで、reasoning、長文コンテキストでの指示追従、コード、エージェントワークフロー向けです。Tencent の OpenAI 互換サンプルでは model id として `hy3-preview` を使い、標準の chat-completions tool calling と `reasoning_effort` をサポートしています。

<Tip>
モデル id は `hy3-preview` です。Tencent の `HY-3D-*` モデルと混同しないでください。これらは 3D 生成 API であり、この provider が設定する OpenClaw の chat model ではありません。
</Tip>

## endpoint 上書き

OpenClaw はデフォルトで Tencent Cloud の `https://tokenhub.tencentmaas.com/v1` endpoint を使います。Tencent は国際 TokenHub endpoint も公開しています。

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

endpoint は、TokenHub アカウントやリージョンで必要な場合にのみ上書きしてください。

## 注

- TokenHub モデル参照は `tencent-tokenhub/<modelId>` を使います。
- バンドル済みカタログには現在 `hy3-preview` が含まれています。
- Plugin は Hy3 preview を reasoning 対応かつ streaming-usage 対応としてマークします。
- Plugin には tiered Hy3 pricing metadata が含まれているため、手動の価格上書きなしでコスト見積もりが埋まります。
- 価格、context、endpoint metadata は必要な場合にのみ `models.providers` で上書きしてください。

## 環境に関する注意

Gateway がデーモン（launchd/systemd）として動作している場合は、`TOKENHUB_API_KEY`
がそのプロセスで利用可能であることを確認してください（たとえば `~/.openclaw/.env` や
`env.shellEnv` を使用）。

## 関連ドキュメント

- [OpenClaw Configuration](/ja-JP/gateway/configuration)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Tencent TokenHub product page](https://cloud.tencent.com/product/tokenhub)
- [Tencent TokenHub text generation](https://cloud.tencent.com/document/product/1823/130079)
- [Tencent TokenHub Cline setup for Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Tencent Hy3 preview model card](https://huggingface.co/tencent/Hy3-preview)
