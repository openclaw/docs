---
read_when:
    - OpenClaw で Cerebras を使用する場合
    - Cerebras API キーの環境変数または CLI 認証の選択が必要です
summary: Cerebras のセットアップ（認証 + モデル選択）
title: Cerebras
x-i18n:
    generated_at: "2026-07-11T22:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) は、カスタム推論ハードウェア上で高速な OpenAI 互換推論を提供します。この Plugin には、4 モデルの静的カタログが同梱されています（ライブ検出はありません）。

| プロパティ          | 値                                                        |
| ------------------- | --------------------------------------------------------- |
| プロバイダー ID     | `cerebras`                                                |
| Plugin              | 公式外部パッケージ（`@openclaw/cerebras-provider`）       |
| 認証環境変数        | `CEREBRAS_API_KEY`                                        |
| オンボーディングフラグ | `--auth-choice cerebras-api-key`                       |
| 直接指定 CLI フラグ | `--cerebras-api-key <key>`                                |
| API                 | OpenAI 互換（`openai-completions`）                       |
| ベース URL          | `https://api.cerebras.ai/v1`                              |
| デフォルトモデル    | `cerebras/zai-glm-4.7`                                    |

## Plugin のインストール

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    <CodeGroup>

```bash オンボーディング
openclaw onboard --auth-choice cerebras-api-key
```

```bash 直接指定フラグ
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 環境変数のみ
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider cerebras
    ```

    4 つの静的モデルがすべて一覧表示されます。`CEREBRAS_API_KEY` を解決できない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

  </Step>
</Steps>

## 非対話型セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 組み込みカタログ

4 つのモデルはすべて、128k のコンテキストウィンドウと最大 8,192 出力トークンを共有します。

| モデル参照                                | 名前                 | 推論 | 注記                                       |
| ----------------------------------------- | -------------------- | ---- | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | あり | デフォルトモデル、プレビュー版推論モデル   |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | あり | 本番用推論モデル                           |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | なし | プレビュー版の非推論モデル                 |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | なし | 速度重視の本番用モデル                     |

<Warning>
Cerebras は `zai-glm-4.7` と `qwen-3-235b-a22b-instruct-2507` をプレビューモデルとして位置付けています。また、`llama3.1-8b` と `qwen-3-235b-a22b-instruct-2507` は、2026 年 5 月 27 日に廃止予定と記載されています。本番ワークロードでこれらを利用する前に、Cerebras の[サポート対象モデルページ](https://inference-docs.cerebras.ai/models/overview)を確認してください。
</Warning>

## 手動設定

ほとんどのセットアップでは API キーのみが必要です。モデルのメタデータを上書きする場合や、静的カタログに対して `mode: "merge"` で実行する場合は、明示的な `models.providers.cerebras` 設定を使用します。

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
Gateway をデーモン（launchd、systemd、Docker）として実行する場合は、そのプロセスから `CEREBRAS_API_KEY` を利用できることを確認してください。たとえば、`~/.openclaw/.env` または `env.shellEnv` を使用します。対話型シェルでのみエクスポートしたキーは、環境変数を別途インポートしない限り、管理対象サービスでは使用できません。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    推論に対応する 2 つの Cerebras モデルの推論エフォートレベル。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトとモデル設定。
  </Card>
  <Card title="モデルに関する FAQ" href="/ja-JP/help/faq-models" icon="circle-question">
    認証プロファイル、モデルの切り替え、「no profile」エラーの解決。
  </Card>
</CardGroup>
