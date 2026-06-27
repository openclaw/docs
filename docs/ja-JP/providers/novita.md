---
read_when:
    - OpenClaw を NovitaAI モデルで実行する
    - Novita プロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClaw で NovitaAI の OpenAI 互換 API を使用する
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T12:45:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI は、OpenAI 互換モデル API を備えたホステッド AI インフラストラクチャプロバイダーです。OpenClaw ではバンドル済みモデルプロバイダーなので、プロバイダー ID は `novita`、認証情報は通常のモデル認証フローを通り、モデル参照は `novita/deepseek/deepseek-v3-0324` のような形式になります。

自前の推論サーバーを運用せずに、オープンウェイトモデルやサードパーティモデルのルートへホステッドアクセスしたい場合は Novita を使用します。バンドル済みカタログは、DeepSeek、Moonshot、MiniMax、GLM、Qwen など、Novita が公開するエージェントターンに実用的なチャットモデルのルートを中心にしています。

このプロバイダーは Novita の OpenAI 互換エンドポイントを使用します。OpenClaw はプロバイダー登録、認証、エイリアス、モデル参照の正規化、ベース URL の選択を処理します。ライブモデルの利用可否、アカウント権限、価格、レート制限は Novita が管理します。

## セットアップ

[novita.ai/settings/key-management](https://novita.ai/settings/key-management) で API キーを作成し、次を実行します。

```bash
openclaw onboard --auth-choice novita-api-key
```

または、次を設定します。

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## デフォルト

- プロバイダー: `novita`
- エイリアス: `novita-ai`, `novitaai`
- ベース URL: `https://api.novita.ai/openai/v1`
- 環境変数: `NOVITA_API_KEY`
- デフォルトモデル: `novita/deepseek/deepseek-v3-0324`

## Novita を選ぶ場合

- OpenAI 互換 API でホステッドのオープンウェイトモデルアクセスが必要な場合。
- 単一のプロバイダーアカウントを通じて、DeepSeek、Kimi、MiniMax、GLM、または Qwen ファミリーのルートを使いたい場合。
- OpenRouter、GMI、DeepInfra、または直接のベンダー API とは別のホステッドフォールバック経路が必要な場合。
- vLLM、SGLang、LM Studio、Ollama インフラストラクチャを保守するよりも、プロバイダー側のモデルホスティングを使いたい場合。

ベンダー固有のリクエストパラメーターやサポート契約が必要な場合は、直接のベンダープロバイダーを選びます。モデルを自前のハードウェア上、または自前のネットワーク境界の内側で実行する必要がある場合は、ローカルプロバイダーを選びます。

## モデル

バンドル済みカタログには、一般的に利用可能な NovitaAI ルート ID がシードされています。例:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

このカタログは、OpenClaw のモデル選択の出発点です。アカウント、リージョン、または Novita の現在のカタログによって、ルートが追加、削除、または制限される場合があります。長期的なデフォルトを設定する前に、CLI からプロバイダーを確認してください。

```bash
openclaw models list --provider novita
```

## トラブルシューティング

- `401` または `403`: Novita のキー管理ページでキーを確認し、保存済みプロファイルが古い場合は `openclaw onboard --auth-choice novita-api-key` を再実行します。
- 不明なモデルエラー: `openclaw models list --provider novita` が返す正確な `novita/<route-id>` を使用します。
- 遅い、または失敗するルート: 別の Novita モデルルートを試すか、プロバイダー固有のばらつきを許容できるワークロードでは Novita をフォールバックプロバイダーとして設定します。

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
