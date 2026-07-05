---
read_when:
    - OpenClaw で Tencent Hy3 preview を使用したい
    - TokenHub APIキーの設定が必要です
summary: Hy3 プレビュー向け Tencent Cloud TokenHub セットアップ
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-07-05T11:46:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d9d0b046ba7f28035048f3b9cd42efa6c1bb7977c67e15fe4a957a8d2c5872c
    source_path: providers/tencent.md
    workflow: 16
---

公式の Tencent Cloud provider plugin をインストールして、OpenAI 互換 API を使用し、TokenHub endpoint (`tencent-tokenhub`) 経由で Tencent Hy3 preview にアクセスします。

| プロパティ        | 値                                    |
| --------------- | ---------------------------------------- |
| Provider ID     | `tencent-tokenhub`                       |
| パッケージ         | `@openclaw/tencent-provider`             |
| 認証環境変数    | `TOKENHUB_API_KEY`                       |
| オンボーディングフラグ | `--auth-choice tokenhub-api-key`         |
| 直接 CLI フラグ | `--tokenhub-api-key <key>`               |
| API             | OpenAI 互換 (`openai-completions`) |
| ベース URL        | `https://tokenhub.tencentmaas.com/v1`    |
| デフォルトモデル   | `tencent-tokenhub/hy3-preview`           |

## クイックスタート

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Create a TokenHub API key">
    Tencent Cloud TokenHub で API キーを作成します。キーに限定されたアクセス範囲を選択する場合は、許可するモデルに **Hy3 preview** を含めてください。
  </Step>
  <Step title="Run onboarding">
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
  <Step title="Verify the model">
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

<Note>
`--accept-risk` は `--non-interactive` と併せて必須です。
</Note>

## 組み込みカタログ

| モデル参照                      | 名前                   | 入力 | コンテキスト | 最大出力 | 注記                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | デフォルト。reasoning 対応 |

Hy3 preview は、reasoning、長いコンテキストでの指示追従、コード、agent workflow 向けの Tencent Hunyuan の大規模 MoE 言語モデルです。標準の chat-completions tool calling と `reasoning_effort` をサポートしています。

<Tip>
  モデル ID は `hy3-preview` です。Tencent の `HY-3D-*` モデルと混同しないでください。これらは 3D 生成 API であり、この provider が設定する OpenClaw chat model ではありません。
</Tip>

## ティア制料金

provider catalog には、入力ウィンドウ長に応じてスケールするティア制コストメタデータが含まれているため、手動の上書きなしでコスト見積もりが入力されます。

| 入力トークン範囲 | 入力レート | 出力レート | キャッシュ読み取り |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

レートは Tencent が公表している USD 建ての 100 万トークンあたりの価格です。別の surface が必要な場合にのみ、`models.providers.tencent-tokenhub` で価格を上書きしてください。

## 高度な設定

<AccordionGroup>
  <Accordion title="Endpoint override">
    OpenClaw の組み込みカタログは Tencent Cloud の `https://tokenhub.tencentmaas.com/v1` endpoint を使用します。TokenHub アカウントまたはリージョンで別の endpoint が必要な場合にのみ上書きしてください。

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Gateway が管理サービス (launchd、systemd、Docker) として実行される場合、`TOKENHUB_API_KEY` はそのプロセスから見えている必要があります。launchd、systemd、または Docker exec 環境が読み取れるように、`~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。

    <Warning>
      対話型シェルでのみ export されたキーは、管理対象の Gateway プロセスからは見えません。永続的に利用できるようにするには、env ファイルまたは config seam を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model providers" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル参照、failover behavior の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    provider 設定を含む完全な config schema。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud の TokenHub product page。
  </Card>
  <Card title="Hy3 preview model card" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview の詳細とベンチマーク。
  </Card>
</CardGroup>
