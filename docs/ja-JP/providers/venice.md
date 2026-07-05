---
read_when:
    - OpenClaw でプライバシー重視の推論を利用したい
    - Venice AI のセットアップ手順が必要です
summary: OpenClawでVenice AIのプライバシー重視モデルを使用する
title: Venice AI
x-i18n:
    generated_at: "2026-07-05T11:42:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) はプライバシー重視の推論を提供します。オープンモデルは
ログなしで実行され、Claude、GPT、Gemini、Grok への匿名化プロキシアクセスも利用できます。
すべてのエンドポイントは OpenAI 互換です（`/v1`）。

## プライバシーモード

| モード         | 動作                                                               | モデル                                                        |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| **プライベート** | プロンプト/レスポンスは保存もログ記録もされません。エフェメラルです。 | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored など。 |
| **匿名化**     | 転送前にメタデータを取り除いて Venice 経由でプロキシされます。      | Claude、GPT、Gemini、Grok                                     |

<Warning>
匿名化モデルは完全にプライベートではありません。Venice は転送前にメタデータを取り除きますが、基盤プロバイダー（OpenAI、Anthropic、Google、xAI）は引き続きリクエストを処理します。完全なプライバシーが必要な場合はプライベートモデルを使用してください。
</Warning>

## はじめに

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="API キーを取得する">
    1. [venice.ai](https://venice.ai) でサインアップします
    2. **Settings > API Keys > Create new key** に移動します
    3. API キーをコピーします（形式: `vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="OpenClaw を設定する">
    <Tabs>
      <Tab title="対話型（推奨）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        API キーの入力を求め（または既存の `VENICE_API_KEY` を再利用し）、利用可能な Venice モデルを一覧表示して、デフォルトモデルを設定します。
      </Tab>
      <Tab title="環境変数">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="非対話型">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="セットアップを検証する">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## モデル選択

- **デフォルト**: `venice/kimi-k2-5`（プライベート、推論、ビジョン）。
- **最強の匿名化オプション**: `venice/claude-opus-4-6`。

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

`openclaw configure` を実行して **Model/auth provider > Venice AI** を選ぶこともできます。

<Tip>
| ユースケース            | モデル                             | 理由                                         |
| ------------------------- | ---------------------------------- | -------------------------------------------- |
| 一般的なチャット（デフォルト） | `kimi-k2-5`                        | 強力なプライベート推論に加えてビジョン       |
| 総合的に最高の品質        | `claude-opus-4-6`                  | 最強の匿名化 Venice オプション               |
| プライバシー + コーディング | `qwen3-coder-480b-a35b-instruct`   | 大きなコンテキストを持つプライベートコーディングモデル |
| 高速 + 低コスト           | `qwen3-4b`                         | 軽量な推論モデル                             |
| 複雑なプライベートタスク  | `deepseek-v3.2`                    | 強力な推論。ツール呼び出しは無効             |
| 無検閲                    | `venice-uncensored`                | コンテンツ制限なし                           |
</Tip>

## 組み込みカタログ（38 モデル）

<AccordionGroup>
  <Accordion title="プライベートモデル（26）— 完全にプライベート、ログ記録なし">
    | モデル ID                              | 名前                                  | コンテキスト | 注記                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | デフォルト、推論、ビジョン  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k    | 推論                   |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | 一般                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | 一般                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | 一般、ツール無効     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | 推論                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | 一般                     |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k    | コーディング                      |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | コーディング                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | 推論、ビジョン           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | 一般                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B（ビジョン）             | 256k    | ビジョン                      |
    | `qwen3-4b`                             | Venice Small（Qwen3 4B）              | 32k     | 高速、推論              |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | 推論、ツール無効    |
    | `venice-uncensored`                    | Venice Uncensored（Dolphin-Mistral）  | 32k     | 無検閲、ツール無効   |
    | `mistral-31-24b`                       | Venice Medium（Mistral）              | 128k    | ビジョン                       |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | ビジョン                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | 一般                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | 一般                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | 推論                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | 一般                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | 推論                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | 推論                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | 推論                    |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k    | 推論                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | 推論                    |
  </Accordion>

  <Accordion title="匿名化モデル（12）— Venice プロキシ経由">
    | モデル ID                       | 名前                            | コンテキスト | 注記                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6（Venice 経由）   | 1M      | 推論、ビジョン            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6（Venice 経由） | 1M      | 推論、ビジョン            |
    | `openai-gpt-54`                 | GPT-5.4（Venice 経由）           | 1M      | 推論、ビジョン            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex（Venice 経由）     | 400k    | 推論、ビジョン、コーディング     |
    | `openai-gpt-52`                 | GPT-5.2（Venice 経由）           | 256k    | 推論                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex（Venice 経由）     | 256k    | 推論、ビジョン、コーディング     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o（Venice 経由）            | 128k    | ビジョン                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（Venice 経由）       | 128k    | ビジョン                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro（Venice 経由）    | 1M      | 推論、ビジョン             |
    | `gemini-3-pro-preview`          | Gemini 3 Pro（Venice 経由）      | 198k    | 推論、ビジョン             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash（Venice 経由）    | 256k    | 推論、ビジョン             |
    | `grok-41-fast`                  | Grok 4.1 Fast（Venice 経由）     | 1M      | 推論、ビジョン             |
  </Accordion>
</AccordionGroup>

Grok ベースの Venice モデル（`grok-41-fast` など）は、ネイティブ xAI プロバイダーと同じツールスキーマ互換パッチを受けます。同じアップストリームのツール呼び出し形式を共有しているためです。

## モデル検出

上記のバンドル済みカタログは、マニフェストに基づくシードリストです。実行時に OpenClaw は Venice `/models` API からこれを更新し、API に到達できない場合はシードリストにフォールバックします。`/models` エンドポイントは公開されています（一覧表示に認証は不要）が、推論には有効な API キーが必要です。

## DeepSeek V4 のリプレイ動作

Venice が `deepseek-v4-pro` や
`deepseek-v4-flash` などの DeepSeek V4 モデルを公開している場合、Venice が省略したときに OpenClaw はアシスタントメッセージの必須 `reasoning_content` リプレイフィールドを埋め、リクエストペイロードから `thinking`/
`reasoning`/`reasoning_effort` を取り除きます（Venice はこれらのモデルで DeepSeek ネイティブの `thinking` 制御を拒否します）。このリプレイ修正は、ネイティブ DeepSeek プロバイダー固有の thinking 制御とは別です。

## ストリーミングとツールサポート

| 機能             | サポート                                           |
| ---------------- | ------------------------------------------------- |
| ストリーミング   | すべてのモデル                                    |
| 関数呼び出し     | ほとんどのモデル。上記の注記があるモデルではモデル単位で無効 |
| ビジョン/画像    | 上記で「ビジョン」と記載されたモデル              |
| JSON モード      | `response_format` 経由                            |

## 料金

Venice はクレジットベースのシステムを使用します。匿名化モデルのコストは、直接 API 料金に少額の Venice 手数料を加えたものとおおむね同等です。現在の料金については
[venice.ai/pricing](https://venice.ai/pricing) を参照してください。

## 使用例

```bash
# Default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="API キーが認識されない">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    キーが `vapi_` で始まることを確認してください。

  </Accordion>

  <Accordion title="モデルを利用できない">
    現在利用可能なモデルを確認するには `openclaw models list --all --provider venice` を実行してください。Venice がモデルを追加または廃止するにつれて、カタログは変わります。
  </Accordion>

  <Accordion title="接続の問題">
    Venice API は `https://api.venice.ai/api/v1` にあります。そのホストへの HTTPS がネットワークで許可されていることを確認してください。
  </Accordion>
</AccordionGroup>

<Note>
詳細ヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定ファイルの例">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI のホームページとアカウント登録。
  </Card>
  <Card title="API ドキュメント" href="https://docs.venice.ai" icon="book">
    Venice API リファレンスと開発者向けドキュメント。
  </Card>
  <Card title="料金" href="https://venice.ai/pricing" icon="credit-card">
    現在の Venice クレジット料金とプラン。
  </Card>
</CardGroup>
