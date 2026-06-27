---
read_when:
    - 多数のLLMに対して単一のAPIキーを使いたい
    - OpenClaw で Kilo Gateway 経由でモデルを実行したい
summary: Kilo Gatewayの統合APIを使用して、OpenClawで多くのモデルにアクセスします
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T12:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway は、単一のエンドポイントと API キーの背後で多数のモデルへリクエストをルーティングする **統一 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

| プロパティ | 値                                 |
| ---------- | ---------------------------------- |
| プロバイダー | `kilocode`                         |
| 認証       | `KILOCODE_API_KEY`                 |
| API        | OpenAI 互換                        |
| ベース URL | `https://api.kilo.ai/api/gateway/` |

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="アカウントを作成">
    [app.kilo.ai](https://app.kilo.ai) にアクセスし、サインインするかアカウントを作成してから、API Keys に移動して新しいキーを生成します。
  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## デフォルトモデル

デフォルトモデルは `kilocode/kilo/auto` です。これは Kilo Gateway によって管理される、プロバイダー所有のスマートルーティングモデルです。

<Note>
OpenClaw は `kilocode/kilo/auto` を安定したデフォルト ref として扱いますが、このルートに対するタスクから上流モデルへの対応付けを、ソースに基づく形では公開していません。`kilocode/kilo/auto` の背後にある正確な上流ルーティングは Kilo Gateway が所有しており、OpenClaw にハードコードされているものではありません。
</Note>

## 組み込みカタログ

OpenClaw は起動時に Kilo Gateway から利用可能なモデルを動的に検出します。アカウントで利用可能なモデルの完全なリストを確認するには、`/models kilocode` を使用します。

Gateway で利用可能な任意のモデルは、`kilocode/` プレフィックス付きで使用できます。

| モデル ref                               | メモ                               |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | デフォルト — スマートルーティング  |
| `kilocode/anthropic/claude-sonnet-4`     | Kilo 経由の Anthropic              |
| `kilocode/openai/gpt-5.5`                | Kilo 経由の OpenAI                 |
| `kilocode/google/gemini-3.1-pro-preview` | Kilo 経由の Google                 |
| ...他にも多数                            | すべてを一覧するには `/models kilocode` を使用 |

<Tip>
起動時に、OpenClaw は `GET https://api.kilo.ai/api/gateway/models` を問い合わせ、検出されたモデルを静的フォールバックカタログより優先してマージします。静的フォールバックには、常に `kilocode/kilo/auto`（`Kilo Auto`）が含まれ、`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000` が設定されています。
</Tip>

## 設定例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="トランスポートと互換性">
    Kilo Gateway はソース上で OpenRouter 互換として文書化されているため、ネイティブ OpenAI リクエスト整形ではなく、プロキシ形式の OpenAI 互換パスに留まります。

    - Gemini バックエンドの Kilo ref はプロキシ Gemini パスに留まるため、OpenClaw はそこで Gemini の thought-signature サニタイズを維持し、ネイティブ Gemini のリプレイ検証やブートストラップの書き換えは有効にしません。
    - Kilo Gateway は内部で API キーを Bearer トークンとして使用します。

  </Accordion>

  <Accordion title="ストリームラッパーと推論">
    Kilo の共有ストリームラッパーは、プロバイダーアプリヘッダーを追加し、対応する具体的なモデル ref のプロキシ推論ペイロードを正規化します。

    <Warning>
    `kilocode/kilo/auto` およびその他のプロキシ推論非対応ヒントでは、推論の注入がスキップされます。推論サポートが必要な場合は、`kilocode/anthropic/claude-sonnet-4` などの具体的なモデル ref を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - 起動時にモデル検出が失敗した場合、OpenClaw は `kilocode/kilo/auto` を含む静的カタログにフォールバックします。
    - API キーが有効であり、Kilo アカウントで目的のモデルが有効になっていることを確認してください。
    - Gateway をデーモンとして実行する場合、そのプロセスで `KILOCODE_API_KEY` を利用できるようにしてください（たとえば `~/.openclaw/.env` 内、または `env.shellEnv` 経由）。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定の完全なリファレンス。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway ダッシュボード、API キー、アカウント管理。
  </Card>
</CardGroup>
