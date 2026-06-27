---
read_when:
    - OpenClaw で Cerebras を使用する
    - Cerebras API キー環境変数または CLI 認証の選択が必要です
summary: Cerebras のセットアップ（認証 + モデル選択）
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T12:40:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) は、カスタム推論ハードウェア上で高速な OpenAI互換の推論を提供します。Cerebras プロバイダー Plugin には、静的な4モデルのカタログが含まれています。

| プロパティ        | 値                                    |
| --------------- | ---------------------------------------- |
| プロバイダー ID     | `cerebras`                               |
| Plugin          | 公式外部パッケージ                |
| 認証環境変数    | `CEREBRAS_API_KEY`                       |
| オンボーディングフラグ | `--auth-choice cerebras-api-key`         |
| 直接 CLI フラグ | `--cerebras-api-key <key>`               |
| API             | OpenAI互換 (`openai-completions`) |
| ベース URL        | `https://api.cerebras.ai/v1`             |
| デフォルトモデル   | `cerebras/zai-glm-4.7`                   |

## Pluginをインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを取得">
    [Cerebras Cloud Console](https://cloud.cerebras.ai) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行">
    <CodeGroup>

```bash オンボーディング
openclaw onboard --auth-choice cerebras-api-key
```

```bash 直接フラグ
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 環境変数のみ
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="モデルが利用可能であることを確認">
    ```bash
    openclaw models list --provider cerebras
    ```

    一覧には4つすべての静的モデルが含まれるはずです。`CEREBRAS_API_KEY` が解決されない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` の下に報告します。

  </Step>
</Steps>

## 非対話セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 組み込みカタログ

OpenClaw は、公開 OpenAI互換エンドポイントを反映した静的な Cerebras カタログを同梱しています。4つのモデルはすべて、128k コンテキストと最大出力 8,192 トークンを共有します。

| モデル参照                                 | 名前                 | 推論 | 注記                                  |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | はい       | デフォルトモデル、プレビュー推論モデル |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | はい       | 本番推論モデル             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | いいえ        | プレビュー非推論モデル            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | いいえ        | 本番向け速度重視モデル         |

<Warning>
  Cerebras は `zai-glm-4.7` と `qwen-3-235b-a22b-instruct-2507` をプレビューモデルとして示しており、`llama3.1-8b` と `qwen-3-235b-a22b-instruct-2507` は 2026年5月27日に非推奨化されることが文書化されています。本番ワークロードでそれらに依存する前に、Cerebras のサポート対象モデルページを確認してください。
</Warning>

## 手動設定

通常、この Plugin では API キーだけが必要です。モデルメタデータを上書きしたい場合や、静的カタログに対して `mode: "merge"` で実行したい場合は、明示的な `models.providers.cerebras` 設定を使用します。

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
  Gateway がデーモン（launchd、systemd、Docker）として実行される場合は、`CEREBRAS_API_KEY` がそのプロセスで利用可能であることを確認してください。たとえば `~/.openclaw/.env` または `env.shellEnv` を通じて設定します。対話シェルでのみエクスポートされたキーは、env が別途インポートされない限り、管理対象サービスには役立ちません。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    推論対応の2つの Cerebras モデル向けの推論エフォートレベル。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトとモデル設定。
  </Card>
  <Card title="モデル FAQ" href="/ja-JP/help/faq-models" icon="circle-question">
    認証プロファイル、モデルの切り替え、「no profile」エラーの解決。
  </Card>
</CardGroup>
