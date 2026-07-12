---
read_when:
    - OpenClaw で Meta を使用する場合
    - MODEL_API_KEY 環境変数または CLI 認証の選択が必要です
summary: Meta のセットアップ（認証 + muse-spark-1.1 モデルの選択）
title: Meta
x-i18n:
    generated_at: "2026-07-12T14:47:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** は、`muse-spark-1.1` 推論モデルに OpenAI 互換の **Responses API**（`POST /v1/responses`）を使用します。このプロバイダーは、OpenClaw にバンドルされた Plugin として提供されます。

| プロパティ | 値 |
| ----------------- | ---------------------------------- |
| プロバイダー ID | `meta` |
| Plugin | バンドル済みプロバイダー |
| 認証環境変数 | `MODEL_API_KEY` |
| オンボーディングフラグ | `--auth-choice meta-api-key` |
| 直接指定する CLI フラグ | `--meta-api-key <key>` |
| API | Responses API（`openai-responses`） |
| ベース URL | `https://api.meta.ai/v1` |
| デフォルトモデル | `meta/muse-spark-1.1` |
| デフォルトの推論 | `high`（`reasoning.effort`） |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider meta
    ```

    静的な `muse-spark-1.1` カタログエントリを一覧表示します。`MODEL_API_KEY` を解決できない場合、`openclaw models status --json` は不足している認証情報を `auth.unusableProfiles` に報告します。

  </Step>
</Steps>

## 非対話型セットアップ

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## 組み込みカタログ

| モデル参照 | 名前 | 推論 | コンテキストウィンドウ | 最大出力 |
| --------------------- | -------------- | --------- | -------------- | ---------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | あり | 1,048,576 | 131,072 |

機能:

- テキスト + 画像入力
- ツール呼び出しとストリーミング
- 推論エフォート: `minimal`、`low`、`medium`、`high`、`xhigh`（デフォルト: `high`）
- ステートレスな暗号化推論リプレイ（`store: false`、`include: ["reasoning.encrypted_content"]`）

<Warning>
`muse-spark-1.1` は `reasoning.effort: "none"` を受け付けません。OpenClaw はこのプロバイダーで `--thinking off` を `minimal` にマッピングします。
</Warning>

## 手動設定

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
Gateway がデーモン（launchd、systemd、Docker）として実行される場合、`MODEL_API_KEY` をそのプロセスから利用できるようにしてください。たとえば、`~/.openclaw/.env` または `env.shellEnv` を使用します。対話型シェルでのみエクスポートされたキーは、環境が別途インポートされない限り、管理対象サービスでは使用できません。
</Note>

## スモークテスト

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

ライブテストでは、`POST /v1/responses` に対して `muse-spark-1.1` を使用します。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="思考モード" href="/ja-JP/tools/thinking" icon="brain">
    muse-spark-1.1 の推論エフォートレベル。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/config-agents#agent-defaults" icon="gear">
    エージェントのデフォルトとモデル設定。
  </Card>
</CardGroup>
