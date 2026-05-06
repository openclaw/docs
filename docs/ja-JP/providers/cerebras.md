---
read_when:
    - OpenClaw で Cerebras を使用したい
    - Cerebras APIキーの環境変数、またはCLI認証の選択が必要です
summary: Cerebras のセットアップ（認証 + モデル選択）
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T05:15:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) は、カスタム推論ハードウェア上で高速な OpenAI 互換推論を提供します。OpenClaw には、静的な 4 モデルのカタログを持つバンドル済み Cerebras プロバイダー Plugin が含まれています。

| プロパティ        | 値                                    |
| --------------- | ---------------------------------------- |
| プロバイダー ID     | `cerebras`                               |
| Plugin          | バンドル済み、`enabledByDefault: true`        |
| 認証環境変数    | `CEREBRAS_API_KEY`                       |
| オンボーディングフラグ | `--auth-choice cerebras-api-key`         |
| 直接指定 CLI フラグ | `--cerebras-api-key <key>`               |
| API             | OpenAI 互換 (`openai-completions`) |
| ベース URL        | `https://api.cerebras.ai/v1`             |
| デフォルトモデル   | `cerebras/zai-glm-4.7`                   |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider cerebras
    ```

    リストには、バンドル済みの 4 つのモデルがすべて含まれている必要があります。`CEREBRAS_API_KEY` が解決されていない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

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

OpenClaw は、公開 OpenAI 互換エンドポイントを反映した静的な Cerebras カタログを同梱しています。4 つのモデルはすべて 128k コンテキストと 8,192 の最大出力トークンを共有します。

| モデル参照                                 | 名前                 | 推論 | 注記                                  |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | はい       | デフォルトモデル、プレビュー推論モデル |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | はい       | 本番用推論モデル             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | いいえ        | プレビュー非推論モデル            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | いいえ        | 本番用の速度重視モデル         |

<Warning>
  Cerebras は `zai-glm-4.7` と `qwen-3-235b-a22b-instruct-2507` をプレビューモデルとして示しており、`llama3.1-8b` と `qwen-3-235b-a22b-instruct-2507` は 2026 年 5 月 27 日に非推奨化される予定として文書化されています。本番ワークロードでこれらに依存する前に、Cerebras のサポート対象モデルページを確認してください。
</Warning>

## 手動設定

通常、バンドル済み Plugin により必要なのは API キーだけです。モデルメタデータを上書きしたい場合、または静的カタログに対して `mode: "merge"` で実行したい場合は、明示的な `models.providers.cerebras` 設定を使用します。

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
  Gateway がデーモン (launchd、systemd、Docker) として実行される場合、そのプロセスから `CEREBRAS_API_KEY` を利用できるようにしてください。たとえば `~/.openclaw/.env` または `env.shellEnv` を通じて渡します。`~/.profile` にだけ置かれたキーは、環境が別途インポートされない限り、管理対象サービスには役立ちません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    推論に対応した 2 つの Cerebras モデルの推論エフォートレベル。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトとモデル設定。
  </Card>
  <Card title="モデル FAQ" href="/ja-JP/help/faq-models" icon="circle-question">
    認証プロファイル、モデルの切り替え、「no profile」エラーの解決。
  </Card>
</CardGroup>
