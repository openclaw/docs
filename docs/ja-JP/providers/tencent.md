---
read_when:
    - OpenClawでTencent Hy modelsを使いたい。
    - TokenHub API keyのセットアップが必要です。
summary: Tencent Cloud TokenHubのセットアップ
title: Tencent Cloud（TokenHub）
x-i18n:
    generated_at: "2026-04-23T14:09:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud（TokenHub）

Tencent Cloudは、OpenClawに**同梱provider Plugin**として含まれています。TokenHub endpoint（`tencent-tokenhub`）経由でTencent Hy modelsにアクセスできます。

このproviderはOpenAI互換APIを使用します。

## クイックスタート

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Providersとendpoints

| Provider | Endpoint | 用途 |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Tencent TokenHub経由のHy |

## 利用可能なmodels

### tencent-tokenhub

- **hy3-preview** — Hy3 preview（256Kコンテキスト、reasoning、デフォルト）

## 注記

- TokenHub model refsは `tencent-tokenhub/<modelId>` を使います。
- このPluginには階層化されたHy3 pricing metadataが組み込まれているため、手動のpricing overrideなしでコスト見積もりが反映されます。
- 必要に応じて、`models.providers` でpricingとコンテキストmetadataをoverrideしてください。

## 環境に関する注記

Gatewayがdaemon（launchd/systemd）として動作している場合は、`TOKENHUB_API_KEY`
がそのprocessから利用可能であることを確認してください（たとえば `~/.openclaw/.env` または
`env.shellEnv` 経由）。

## 関連ドキュメント

- [OpenClaw Configuration](/ja-JP/gateway/configuration)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
