---
read_when:
    - OpenClawでTencent hy3を使用したい
    - TokenHub または TokenPlan API キーの設定が必要です
summary: Tencent Cloud TokenHub と TokenPlan の hy3 向けセットアップ
title: Tencent Cloud（TokenHub / TokenPlan）
x-i18n:
    generated_at: "2026-07-06T10:52:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Hy3 に OpenAI 互換 API でアクセスするため、2 つのエンドポイント — TokenHub (`tencent-tokenhub`) と TokenPlan (`tencent-tokenplan`) — を通じて公式 Tencent Cloud プロバイダー Plugin をインストールします。

| プロパティ                  | 値                                                    |
| ------------------------- | ----------------------------------------------------- |
| プロバイダー ID              | `tencent-tokenhub`, `tencent-tokenplan`               |
| パッケージ                   | `@openclaw/tencent-provider`                          |
| TokenHub 認証環境変数        | `TOKENHUB_API_KEY`                                    |
| TokenPlan 認証環境変数       | `TOKENPLAN_API_KEY`                                   |
| TokenHub オンボーディングフラグ | `--auth-choice tokenhub-api-key`                      |
| TokenPlan オンボーディングフラグ | `--auth-choice tokenplan-api-key`                     |
| TokenHub 直接 CLI フラグ     | `--tokenhub-api-key <key>`                            |
| TokenPlan 直接 CLI フラグ    | `--tokenplan-api-key <key>`                           |
| API                       | OpenAI 互換 (`openai-completions`)                    |
| TokenHub ベース URL         | `https://tokenhub.tencentmaas.com/v1`                 |
| TokenHub グローバルベース URL | `https://tokenhub-intl.tencentmaas.com/v1` (オーバーライド) |
| TokenPlan ベース URL        | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| デフォルトモデル              | `tencent-tokenhub/hy3`                                |

## クイックスタート

<Steps>
  <Step title="Tencent API キーを作成する">
    Tencent Cloud TokenHub と TokenPlan の API キーを作成します。キーに制限付きアクセス範囲を選択する場合は、許可するモデルに **hy3** (TokenHub で使用する予定がある場合は **hy3 preview** も) を含めてください。
  </Step>
  <Step title="オンボーディングを実行する">
    <CodeGroup>

```bash TokenHub onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="モデルを検証する">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## 非対話セットアップ

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` は `--non-interactive` と併せて必要です。
</Note>

## 組み込みカタログ

| モデル参照                      | 名前                   | 入力 | コンテキスト | 最大出力 | 注記             |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | text  | 256,000 | 64,000     | 推論対応 |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | text  | 256,000 | 64,000     | 推論対応 |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | text  | 256,000 | 64,000     | 推論対応 |

hy3 は Tencent Hunyuan の大規模 MoE 言語モデルで、推論、長いコンテキストでの指示追従、コード、エージェントワークフロー向けです。Tencent の OpenAI 互換の例では、モデル ID として `hy3` を使用し、標準のチャット補完ツール呼び出しと `reasoning_effort` をサポートしています。

<Tip>
  モデル ID は `hy3` です。Tencent の `HY-3D-*` モデルと混同しないでください。これらは 3D 生成 API であり、このプロバイダーで設定される OpenClaw チャットモデルではありません。
</Tip>

## 高度な設定

<AccordionGroup>
  <Accordion title="エンドポイントのオーバーライド">
    OpenClaw の組み込みカタログは Tencent Cloud の `https://tokenhub.tencentmaas.com/v1` エンドポイントを使用します。TokenHub アカウントまたはリージョンで別のエンドポイントが必要な場合にのみオーバーライドしてください。

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="デーモンでの環境の可用性">
    Gateway がマネージドサービス (launchd、systemd、Docker) として実行される場合、`TOKENHUB_API_KEY` と `TOKENPLAN_API_KEY` はそのプロセスから見える必要があります。launchd、systemd、または Docker exec 環境が読み取れるように、`~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。

    <Warning>
      対話型シェルでのみエクスポートされたキーは、マネージド Gateway プロセスからは見えません。永続的な可用性のために env ファイルまたは設定シームを使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Tencent Cloud の TokenHub 製品ページ。
  </Card>
  <Card title="Hy3 preview モデルカード" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Tencent Hunyuan Hy3 preview の詳細とベンチマーク。
  </Card>
</CardGroup>
