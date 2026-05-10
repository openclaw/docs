---
read_when:
    - 多数の LLM に対して単一の API キーを使いたい
    - OpenClawでKilo Gateway経由でモデルを実行したい場合
summary: Kilo Gateway の統合 API を使用して OpenClaw で多数のモデルにアクセスする
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-10T19:49:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3de2d983a028082d0a897fdafa48ff1f2ad82f3aacec547763159db07adb00a2
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway は、単一のエンドポイントと API キーの背後で多数のモデルにリクエストをルーティングする **統合 API** を提供します。OpenAI 互換なので、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

| プロパティ | 値                                 |
| -------- | ---------------------------------- |
| プロバイダー | `kilocode`                         |
| 認証     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 互換                        |
| ベース URL | `https://api.kilo.ai/api/gateway/` |

## はじめに

<Steps>
  <Step title="アカウントを作成する">
    [app.kilo.ai](https://app.kilo.ai) に移動し、サインインするかアカウントを作成してから、API Keys に移動して新しいキーを生成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## デフォルトモデル

デフォルトモデルは `kilocode/kilo/auto` です。これは Kilo Gateway によって管理される、プロバイダー所有のスマートルーティングモデルです。

<Note>
OpenClaw は `kilocode/kilo/auto` を安定したデフォルト参照として扱いますが、そのルートについて、ソースに基づくタスクから上流モデルへの対応表は公開していません。`kilocode/kilo/auto` の背後にある正確な上流ルーティングは Kilo Gateway が所有しており、OpenClaw にハードコードされているものではありません。
</Note>

## 組み込みカタログ

OpenClaw は起動時に Kilo Gateway から利用可能なモデルを動的に検出します。アカウントで利用可能なモデルの完全な一覧を表示するには、`/models kilocode` を使用します。

Gateway で利用可能な任意のモデルは、`kilocode/` プレフィックス付きで使用できます。

| モデル参照                              | 注記                               |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | デフォルト — スマートルーティング |
| `kilocode/anthropic/claude-sonnet-4`     | Kilo 経由の Anthropic              |
| `kilocode/openai/gpt-5.5`                | Kilo 経由の OpenAI                 |
| `kilocode/google/gemini-3.1-pro-preview` | Kilo 経由の Google                 |
| ...ほか多数                              | すべてを一覧するには `/models kilocode` を使用 |

<Tip>
起動時に、OpenClaw は `GET https://api.kilo.ai/api/gateway/models` を照会し、検出したモデルを静的フォールバックカタログより優先してマージします。バンドルされたフォールバックには常に、`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000` を持つ `kilocode/kilo/auto` (`Kilo Auto`) が含まれます。
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

    - Gemini backed の Kilo 参照はプロキシ Gemini パスに留まるため、OpenClaw はネイティブ Gemini のリプレイ検証やブートストラップ書き換えを有効にせず、そこで Gemini の thought-signature サニタイズを維持します。
    - Kilo Gateway は内部的に、API キーを Bearer トークンとして使用します。

  </Accordion>

  <Accordion title="ストリームラッパーと推論">
    Kilo の共有ストリームラッパーは、プロバイダーアプリヘッダーを追加し、サポートされている具体的なモデル参照に対してプロキシ推論ペイロードを正規化します。

    <Warning>
    `kilocode/kilo/auto` およびその他の proxy-reasoning-unsupported ヒントは推論インジェクションをスキップします。推論サポートが必要な場合は、`kilocode/anthropic/claude-sonnet-4` などの具体的なモデル参照を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - 起動時にモデル検出に失敗した場合、OpenClaw は `kilocode/kilo/auto` を含むバンドル済み静的カタログにフォールバックします。
    - API キーが有効であり、Kilo アカウントで目的のモデルが有効になっていることを確認してください。
    - Gateway がデーモンとして実行される場合は、`KILOCODE_API_KEY` がそのプロセスで利用可能であることを確認してください（たとえば `~/.openclaw/.env` 内、または `env.shellEnv` 経由）。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定の完全なリファレンス。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway ダッシュボード、API キー、アカウント管理。
  </Card>
</CardGroup>
