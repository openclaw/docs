---
read_when:
    - OpenClaw でプライバシー重視の推論を使いたい
    - Venice AI のセットアップガイダンスが必要です
summary: OpenClawでVenice AIのプライバシー重視モデルを使用する
title: Venice AI
x-i18n:
    generated_at: "2026-06-27T12:51:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI は、無検閲モデルのサポートと、匿名化プロキシ経由での主要なプロプライエタリモデルへのアクセスを備えた、**プライバシー重視の AI 推論**を提供します。すべての推論はデフォルトでプライベートです。あなたのデータでの学習も、ログ記録もありません。

## OpenClaw で Venice を使う理由

- オープンソースモデル向けの**プライベート推論**（ログ記録なし）。
- 必要な場合に使える**無検閲モデル**。
- 品質が重要な場合のプロプライエタリモデル（Opus/GPT/Gemini）への**匿名化アクセス**。
- OpenAI 互換の `/v1` エンドポイント。

## プライバシーモード

Venice は 2 つのプライバシーレベルを提供しています。モデルを選ぶうえで、これを理解することが重要です。

| モード         | 説明                                                                                                                              | モデル                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **プライベート** | 完全にプライベートです。プロンプト/応答は**保存もログ記録も一切されません**。一時的に扱われます。                                 | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored など。 |
| **匿名化**     | メタデータを除去したうえで Venice 経由でプロキシされます。基盤プロバイダー（OpenAI、Anthropic、Google、xAI）は匿名化されたリクエストを受け取ります。 | Claude、GPT、Gemini、Grok                                     |

<Warning>
匿名化モデルは完全にプライベートでは**ありません**。Venice は転送前にメタデータを除去しますが、基盤プロバイダー（OpenAI、Anthropic、Google、xAI）は引き続きリクエストを処理します。完全なプライバシーが必要な場合は、**プライベート**モデルを選んでください。
</Warning>

## 機能

- **プライバシー重視**: 「プライベート」（完全にプライベート）モードと「匿名化」（プロキシ）モードを選択できます
- **無検閲モデル**: コンテンツ制限のないモデルにアクセスできます
- **主要モデルへのアクセス**: Venice の匿名化プロキシ経由で Claude、GPT、Gemini、Grok を使用できます
- **OpenAI 互換 API**: 簡単に統合できる標準の `/v1` エンドポイント
- **ストリーミング**: すべてのモデルでサポート
- **関数呼び出し**: 一部のモデルでサポート（モデルの機能を確認してください）
- **Vision**: Vision 機能を持つモデルでサポート
- **厳格なレート制限なし**: 極端な使用ではフェアユースのスロットリングが適用される場合があります

## はじめに

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Get your API key">
    1. [venice.ai](https://venice.ai) で登録します
    2. **Settings > API Keys > Create new key** に移動します
    3. API キーをコピーします（形式: `vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="Configure OpenClaw">
    希望するセットアップ方法を選択します。

    <Tabs>
      <Tab title="Interactive (recommended)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        これにより、次の処理が行われます。
        1. API キーの入力を求めます（または既存の `VENICE_API_KEY` を使用します）
        2. 利用可能なすべての Venice モデルを表示します
        3. デフォルトモデルを選択できます
        4. プロバイダーを自動的に設定します
      </Tab>
      <Tab title="Environment variable">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Non-interactive">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## モデル選択

セットアップ後、OpenClaw は利用可能なすべての Venice モデルを表示します。必要に応じて選択してください。

- **デフォルトモデル**: 強力なプライベート推論と Vision を備えた `venice/kimi-k2-5`。
- **高性能オプション**: 最も強力な匿名化 Venice 経路として `venice/claude-opus-4-6`。
- **プライバシー**: 完全にプライベートな推論には「プライベート」モデルを選択します。
- **機能**: Venice のプロキシ経由で Claude、GPT、Gemini にアクセスするには「匿名化」モデルを選択します。

デフォルトモデルはいつでも変更できます。

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

利用可能なすべてのモデルを一覧表示します。

```bash
openclaw models list --all --provider venice
```

`openclaw configure` を実行し、**Model/auth** を選択して、**Venice AI** を選ぶこともできます。

<Tip>
ユースケースに適したモデルを選ぶには、以下の表を使用してください。

| ユースケース               | 推奨モデル                         | 理由                                         |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **一般的なチャット（デフォルト）** | `kimi-k2-5`                      | 強力なプライベート推論と Vision              |
| **総合的に最高の品質**     | `claude-opus-4-6`                | 最も強力な匿名化 Venice オプション           |
| **プライバシー + コーディング** | `qwen3-coder-480b-a35b-instruct` | 大きなコンテキストを備えたプライベートコーディングモデル |
| **プライベート Vision**    | `kimi-k2-5`                      | プライベートモードを離れずに Vision をサポート |
| **高速 + 低コスト**        | `qwen3-4b`                       | 軽量な推論モデル                             |
| **複雑なプライベートタスク** | `deepseek-v3.2`                  | 強力な推論。ただし Venice ツールサポートなし |
| **無検閲**                 | `venice-uncensored`              | コンテンツ制限なし                           |

</Tip>

## DeepSeek V4 のリプレイ動作

Venice が `venice/deepseek-v4-pro` や
`venice/deepseek-v4-flash` などの DeepSeek V4 モデルを公開している場合、
プロキシがそれを省略したとき、OpenClaw は assistant メッセージに必要な DeepSeek V4
`reasoning_content` リプレイプレースホルダーを補完します。Venice は DeepSeek ネイティブのトップレベル `thinking` 制御を拒否するため、
OpenClaw はそのプロバイダー固有のリプレイ修正を、ネイティブ
DeepSeek プロバイダーの thinking 制御とは分離して扱います。

## 組み込みカタログ（合計 41）

<AccordionGroup>
  <Accordion title="Private models (26) — fully private, no logging">
    | モデル ID                              | 名前                                | コンテキスト | 機能                       |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | デフォルト、推論、Vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | 推論                       |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 一般                       |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 一般                       |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 一般、ツール無効           |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | 推論                       |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 一般                       |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | コーディング               |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | コーディング               |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | 推論、Vision               |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 一般                       |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | 高速、推論                 |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | 推論、ツール無効           |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | 無検閲、ツール無効         |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | 一般                       |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | 一般                       |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | 推論                       |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | 一般                       |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | 推論                       |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | 推論                       |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | 推論                       |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | 推論                       |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | 推論                       |
  </Accordion>

  <Accordion title="Anonymized models (12) — via Venice proxy">
    | モデル ID                       | 名前                           | コンテキスト | 機能                      |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6（Venice 経由） | 1M      | 推論、Vision              |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6（Venice 経由） | 1M      | 推論、Vision              |
    | `openai-gpt-54`                 | GPT-5.4（Venice 経由）         | 1M      | 推論、Vision              |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex（Venice 経由）   | 400k    | 推論、Vision、コーディング |
    | `openai-gpt-52`                 | GPT-5.2（Venice 経由）         | 256k    | 推論                      |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex（Venice 経由）   | 256k    | 推論、Vision、コーディング |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o（Venice 経由）          | 128k    | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（Venice 経由）     | 128k    | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro（Venice 経由）  | 1M      | 推論、Vision              |
    | `gemini-3-pro-preview`          | Gemini 3 Pro（Venice 経由）    | 198k    | 推論、Vision              |
    | `gemini-3-flash-preview`        | Gemini 3 Flash（Venice 経由）  | 256k    | 推論、Vision              |
    | `grok-41-fast`                  | Grok 4.1 Fast（Venice 経由）   | 1M      | 推論、Vision              |
  </Accordion>
</AccordionGroup>

## モデル検出

OpenClaw は、読み取り専用のモデル一覧表示のために、マニフェストに基づく Venice シードカタログを同梱しています。ランタイム更新では引き続き Venice API からモデルを検出でき、API に到達できない場合はマニフェストカタログにフォールバックします。

`/models` エンドポイントは公開されています（一覧表示に認証は不要です）が、推論には有効な API キーが必要です。

## ストリーミングとツールサポート

| 機能                 | サポート                                             |
| -------------------- | ---------------------------------------------------- |
| **ストリーミング**   | すべてのモデル                                       |
| **関数呼び出し**     | ほとんどのモデル（API の `supportsFunctionCalling` を確認） |
| **Vision/画像**      | 「Vision」機能付きとしてマークされたモデル           |
| **JSON モード**      | `response_format` でサポート                         |

## 料金

Venice はクレジットベースのシステムを使用します。現在の料金は [venice.ai/pricing](https://venice.ai/pricing) を確認してください。

- **プライベートモデル**: 一般的に低コスト
- **匿名化モデル**: 直接 API 料金 + 少額の Venice 手数料と同程度

### Venice（匿名化）と直接 API

| 観点         | Venice（匿名化）                 | 直接 API             |
| ------------ | -------------------------------- | -------------------- |
| **プライバシー** | メタデータを除去し、匿名化       | アカウントに紐づく   |
| **レイテンシ** | +10-50ms（プロキシ）             | 直接                 |
| **機能**     | ほとんどの機能をサポート         | すべての機能         |
| **請求**     | Venice クレジット                | プロバイダー請求     |

## 使用例

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    キーが `vapi_` で始まることを確認してください。

  </Accordion>

  <Accordion title="Model not available">
    Venice モデルカタログは動的に更新されます。現在利用可能なモデルを確認するには `openclaw models list` を実行してください。一部のモデルは一時的にオフラインになっている場合があります。
  </Accordion>

  <Accordion title="Connection issues">
    Venice API は `https://api.venice.ai/api/v1` にあります。ネットワークで HTTPS 接続が許可されていることを確認してください。
  </Accordion>
</AccordionGroup>

<Note>
詳細なヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Config file example">
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
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI のホームページとアカウント登録。
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Venice API リファレンスと開発者向けドキュメント。
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    現在の Venice クレジット料金とプラン。
  </Card>
</CardGroup>
