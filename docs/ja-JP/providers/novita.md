---
read_when:
    - NovitaAI モデルで OpenClaw を実行したい
    - Novita のプロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClawでNovitaAIのOpenAI互換APIを使用する
title: NovitaAI
x-i18n:
    generated_at: "2026-07-05T11:45:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI は、OpenAI 互換 API を備えたホスト型 AI インフラストラクチャプロバイダーです。
バンドル済みの OpenClaw プロバイダーとして提供されるため（別途 Plugin のインストールは不要）、
認証情報は通常のモデル認証フローを通り、モデル参照は
`novita/deepseek/deepseek-v3-0324` のようになります。

## セットアップ

[novita.ai/settings/key-management](https://novita.ai/settings/key-management) で API キーを作成してから、次を実行します。

```bash
openclaw onboard --auth-choice novita-api-key
```

または、次を設定します。

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## デフォルト

| 設定          | 値                                 |
| ------------- | ---------------------------------- |
| プロバイダー ID | `novita`                           |
| エイリアス    | `novita-ai`, `novitaai`            |
| ベース URL    | `https://api.novita.ai/openai/v1`  |
| 環境変数      | `NOVITA_API_KEY`                   |
| デフォルトモデル | `novita/deepseek/deepseek-v3-0324` |

## バンドル済みモデルカタログ

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

これは開始点であり、ライブカタログではありません。アカウント、リージョン、または
Novita の現在の提供内容によって、ルートが追加、削除、制限される場合があります。長期間使うデフォルトを設定する前に確認してください。

```bash
openclaw models list --provider novita
```

## Novita を選ぶ場合

- OpenAI 互換 API による、ホスト型オープンウェイトモデルへのアクセス。
- 単一のプロバイダーアカウント経由での DeepSeek、Kimi、MiniMax、GLM、または Qwen ファミリーのルート。
- DeepInfra、GMI、OpenRouter、または直接のベンダー API に加えた、別のホスト型フォールバック経路。
- LM Studio、Ollama、SGLang、または vLLM インフラストラクチャを維持する代わりの、プロバイダー側モデルホスティング。

ベンダー固有のリクエストパラメーターやサポート契約が必要な場合は、直接のベンダープロバイダーを選んでください。モデルを自分のハードウェアまたはネットワーク境界内で実行する必要がある場合は、ローカルプロバイダーを選んでください。

## トラブルシューティング

- `401`/`403`: Novita のキー管理ページでキーを確認し、保存済みプロファイルが古い場合は
  `openclaw onboard --auth-choice novita-api-key` を再実行してください。
- 不明なモデルのエラー: `openclaw models list --provider novita` が返す正確な
  `novita/<route-id>` を使用してください。
- 遅い、または失敗するルート: 別の Novita モデルルートを試すか、プロバイダー固有のばらつきを許容できるワークロードでは Novita をフォールバックプロバイダーとして設定してください。

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [プロバイダーディレクトリ](/ja-JP/providers/index)
