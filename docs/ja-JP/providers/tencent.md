---
read_when:
    - OpenClaw で Tencent Hy3 preview を使用したい
    - TokenHub API キーのセットアップが必要です
summary: Tencent Cloud TokenHub の Hy3 プレビュー向けセットアップ
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T12:50:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

公式の Tencent Cloud プロバイダー Plugin をインストールして、OpenAI 互換 API を使用し、TokenHub エンドポイント (`tencent-tokenhub`) 経由で Tencent Hy3 preview にアクセスします。

| プロパティ         | 値                                                    |
| ---------------- | ----------------------------------------------------- |
| プロバイダー ID    | `tencent-tokenhub`                                    |
| パッケージ          | `@openclaw/tencent-provider`                          |
| 認証環境変数        | `TOKENHUB_API_KEY`                                    |
| オンボーディングフラグ | `--auth-choice tokenhub-api-key`                      |
| 直接 CLI フラグ     | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 互換 (`openai-completions`)                     |
| デフォルトベース URL | `https://tokenhub.tencentmaas.com/v1`                 |
| グローバルベース URL | `https://tokenhub-intl.tencentmaas.com/v1` (上書き)   |
| デフォルトモデル     | `tencent-tokenhub/hy3-preview`                        |

## クイックスタート

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="TokenHub API キーを作成する">
    Tencent Cloud TokenHub で API キーを作成します。キーに制限付きアクセススコープを選択する場合は、許可モデルに **Hy3 preview** を含めます。
  </Step>
  <Step title="オンボーディングを実行する">
    <CodeGroup>

```bash オンボーディング
openclaw onboard --auth-choice tokenhub-api-key
```

```bash 直接フラグ
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash 環境変数のみ
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="モデルを検証する">
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

| モデル参照                     | 名前                   | 入力 | コンテキスト | 最大出力 | 注記                         |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | デフォルト。推論対応          |

Hy3 preview は Tencent Hunyuan の大規模 MoE 言語モデルで、推論、長いコンテキストでの指示追従、コード、エージェントワークフロー向けです。Tencent の OpenAI 互換の例では、モデル ID として `hy3-preview` を使用し、標準の chat-completions ツール呼び出しと `reasoning_effort` をサポートしています。

<Tip>
  モデル ID は `hy3-preview` です。Tencent の `HY-3D-*` モデルと混同しないでください。これらは 3D 生成 API であり、このプロバイダーが設定する OpenClaw チャットモデルではありません。
</Tip>

## 段階制料金

プロバイダーカタログには、入力ウィンドウ長に応じてスケールする段階制のコストメタデータが含まれているため、手動で上書きしなくてもコスト見積もりが入力されます。

| 入力トークン範囲 | 入力レート | 出力レート | キャッシュ読み取り |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

料金は Tencent が提示している USD 建ての 100 万トークンあたりの金額です。別のサーフェスが必要な場合にのみ、`models.providers.tencent-tokenhub` 配下で料金を上書きしてください。

## 高度な設定

<AccordionGroup>
  <Accordion title="エンドポイントの上書き">
    OpenClaw はデフォルトで Tencent Cloud の `https://tokenhub.tencentmaas.com/v1` エンドポイントを使用します。Tencent は国際版 TokenHub エンドポイントも文書化しています。

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    TokenHub アカウントまたはリージョンで必要な場合にのみ、エンドポイントを上書きしてください。

  </Accordion>

  <Accordion title="デーモンでの環境変数の利用可否">
    Gateway がマネージドサービス (launchd、systemd、Docker) として実行される場合、`TOKENHUB_API_KEY` はそのプロセスから見える必要があります。launchd、systemd、または Docker exec 環境が読み取れるように、`~/.openclaw/.env` または `env.shellEnv` 経由で設定します。

    <Warning>
      対話シェルでのみエクスポートされたキーは、マネージド Gateway プロセスからは見えません。永続的に利用できるようにするには、環境変数ファイルまたは設定の接続点を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud の TokenHub 製品ページ。
  </Card>
  <Card title="Hy3 preview モデルカード" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview の詳細とベンチマーク。
  </Card>
</CardGroup>
