---
read_when:
    - OpenClaw で Cerebras を使用したい場合
    - Cerebras API キー環境変数または CLI 認証の選択が必要です
summary: Cerebras のセットアップ（認証 + モデル選択）
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T05:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) は高速な OpenAI 互換推論を提供します。

| プロパティ | 値                           |
| -------- | ---------------------------- |
| プロバイダー | `cerebras`                   |
| 認証     | `CEREBRAS_API_KEY`           |
| API      | OpenAI 互換                   |
| ベース URL | `https://api.cerebras.ai/v1` |

## はじめに

<Steps>
  <Step title="Get an API key">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) で API キーを作成します。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### 非対話型セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 組み込みカタログ

OpenClaw は、公開 OpenAI 互換エンドポイント向けに静的な Cerebras カタログを同梱しています。

| モデル参照                                  | 名前                 | 注記                                   |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | デフォルトモデル。プレビュー推論モデル |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 本番向け推論モデル                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | プレビュー非推論モデル                 |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 本番向け速度重視モデル                 |

<Warning>
Cerebras は `zai-glm-4.7` と `qwen-3-235b-a22b-instruct-2507` をプレビューモデルとして位置付けており、`llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` は 2026 年 5 月 27 日に廃止予定として文書化されています。本番環境で依存する前に、Cerebras のサポート対象モデルページを確認してください。
</Warning>

## 手動設定

通常、同梱 Plugin により必要なのは API キーだけです。モデルメタデータを上書きしたい場合は、明示的な
`models.providers.cerebras` 設定を使用します。

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Gateway がデーモン (launchd/systemd) として実行される場合は、たとえば `~/.openclaw/.env` または
`env.shellEnv` を通じて、そのプロセスで `CEREBRAS_API_KEY` が利用可能であることを確認してください。
</Note>
