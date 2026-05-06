---
read_when:
    - Tencent Hy3 プレビューを OpenClaw で使用したい場合
    - TokenHub API キーのセットアップが必要です
summary: Hy3 プレビュー向け Tencent Cloud TokenHub セットアップ
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T05:17:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud は OpenClaw にバンドルされたプロバイダー Plugin として提供されます。TokenHub エンドポイント (`tencent-tokenhub`) を通じて、OpenAI 互換 API で Tencent Hy3 preview にアクセスできます。

| プロパティ         | 値                                                 |
| ---------------- | ----------------------------------------------------- |
| プロバイダー ID      | `tencent-tokenhub`                                    |
| Plugin           | バンドル済み、`enabledByDefault: true`                     |
| 認証環境変数     | `TOKENHUB_API_KEY`                                    |
| オンボーディングフラグ  | `--auth-choice tokenhub-api-key`                      |
| 直接 CLI フラグ  | `--tokenhub-api-key <key>`                            |
| API              | OpenAI 互換 (`openai-completions`)              |
| デフォルト base URL | `https://tokenhub.tencentmaas.com/v1`                 |
| グローバル base URL  | `https://tokenhub-intl.tencentmaas.com/v1` (上書き) |
| デフォルトモデル    | `tencent-tokenhub/hy3-preview`                        |

## クイックスタート

<Steps>
  <Step title="TokenHub API キーを作成する">
    Tencent Cloud TokenHub で API キーを作成します。キーに制限付きアクセススコープを選択する場合は、許可モデルに **Hy3 preview** を含めてください。
  </Step>
  <Step title="オンボーディングを実行する">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

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

| モデル参照                      | 名前                   | 入力 | コンテキスト | 最大出力 | 注記                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | デフォルト。reasoning 対応 |

Hy3 preview は、reasoning、長いコンテキストでの指示追従、コード、エージェントワークフロー向けの Tencent Hunyuan の大規模 MoE 言語モデルです。Tencent の OpenAI 互換の例では、モデル ID として `hy3-preview` を使用し、標準の chat-completions ツール呼び出しと `reasoning_effort` をサポートしています。

<Tip>
  モデル ID は `hy3-preview` です。Tencent の `HY-3D-*` モデルと混同しないでください。これらは 3D 生成 API であり、このプロバイダーで設定される OpenClaw チャットモデルではありません。
</Tip>

## 段階制料金

バンドルされたカタログには、入力ウィンドウ長に応じてスケールする段階制コストメタデータが含まれているため、手動の上書きなしでコスト見積もりが入力されます。

| 入力トークン範囲 | 入力レート | 出力レート | キャッシュ読み取り |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

レートは Tencent が公表している USD 建ての 100 万トークンあたりの価格です。異なるサーフェスが必要な場合にのみ、`models.providers.tencent-tokenhub` の下で料金を上書きしてください。

## 詳細設定

<AccordionGroup>
  <Accordion title="エンドポイントの上書き">
    OpenClaw はデフォルトで Tencent Cloud の `https://tokenhub.tencentmaas.com/v1` エンドポイントを使用します。Tencent は国際向け TokenHub エンドポイントも文書化しています。

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    TokenHub アカウントまたはリージョンで必要な場合にのみ、エンドポイントを上書きしてください。

  </Accordion>

  <Accordion title="デーモン向けの環境利用可能性">
    Gateway が管理サービス (launchd、systemd、Docker) として実行される場合、`TOKENHUB_API_KEY` はそのプロセスから見える必要があります。launchd、systemd、または Docker exec 環境が読み取れるように、`~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。

    <Warning>
      `~/.profile` にのみ設定されたキーは、管理対象の Gateway プロセスからは見えません。永続的に利用できるようにするには、env ファイルまたは設定の継ぎ目を使用してください。
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
