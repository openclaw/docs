---
read_when:
    - OpenClaw でプライバシー重視の推論を使いたい場合
    - Venice AI のセットアップガイダンスが必要な場合
summary: OpenClaw で Venice AI のプライバシー重視モデルを使う
title: Venice AI
x-i18n:
    generated_at: "2026-04-24T05:17:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab50c76ce33bd67d51bd897ac574e08d4e4e394470bed9fe686758ce39aded91
    source_path: providers/venice.md
    workflow: 15
---

Venice AI は **プライバシー重視の AI 推論** を提供しており、uncensored モデルのサポートと、匿名化プロキシ経由で主要な proprietary モデルへのアクセスを備えています。すべての推論はデフォルトで private です — データ学習なし、ログ保存なしです。

## なぜ OpenClaw で Venice を使うのか

- オープンソースモデル向けの **private inference**（ログなし）。
- 必要なときの **uncensored モデル**。
- 品質が重要なときの、proprietary モデル（Opus / GPT / Gemini）への **匿名化アクセス**。
- OpenAI 互換の `/v1` エンドポイント。

## プライバシーモード

Venice は 2 つのプライバシーレベルを提供します — モデル選択にはこの違いの理解が重要です:

| モード         | 説明                                                                                                                            | モデル                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private**    | 完全に private。プロンプト / レスポンスは **保存もログ記録もされない**。エフェメラル。                                         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored など |
| **Anonymized** | Venice 経由でプロキシされ、メタデータを削除。基盤プロバイダ（OpenAI, Anthropic, Google, xAI）は匿名化されたリクエストを受け取る。 | Claude, GPT, Gemini, Grok                                     |

<Warning>
Anonymized モデルは **完全には private ではありません**。Venice は転送前にメタデータを削除しますが、基盤プロバイダ（OpenAI, Anthropic, Google, xAI）は依然としてリクエストを処理します。完全なプライバシーが必要な場合は **Private** モデルを選んでください。
</Warning>

## 機能

- **プライバシー重視**: 「private」（完全 private）と「anonymized」（プロキシ経由）から選べる
- **Uncensored モデル**: コンテンツ制限なしのモデルにアクセスできる
- **主要モデルへのアクセス**: Claude、GPT、Gemini、Grok を Venice の匿名化プロキシ経由で利用できる
- **OpenAI 互換 API**: 簡単に統合できる標準 `/v1` エンドポイント
- **ストリーミング**: すべてのモデルで対応
- **Function calling**: 一部モデルで対応（モデル機能を確認）
- **Vision**: vision 機能を持つモデルで対応
- **厳格なレート制限なし**: 極端な使用では fair-use throttling が適用される場合あり

## はじめに

<Steps>
  <Step title="API キーを取得">
    1. [venice.ai](https://venice.ai) でサインアップ
    2. **Settings > API Keys > Create new key** に移動
    3. API キー（形式: `vapi_xxxxxxxxxxxx`）をコピー
  </Step>
  <Step title="OpenClaw を設定">
    好みのセットアップ方法を選んでください:

    <Tabs>
      <Tab title="対話式（推奨）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        これにより:
        1. API キーの入力を求める（または既存の `VENICE_API_KEY` を使う）
        2. 利用可能な Venice モデルをすべて表示する
        3. デフォルトモデルを選べるようにする
        4. プロバイダを自動設定する
      </Tab>
      <Tab title="環境変数">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="非対話式">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="セットアップを確認">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## モデル選択

セットアップ後、OpenClaw は利用可能な Venice モデルをすべて表示します。用途に応じて選んでください:

- **デフォルトモデル**: 強い private reasoning と vision を備えた `venice/kimi-k2-5`
- **高機能オプション**: 最強の anonymized Venice 経路として `venice/claude-opus-4-6`
- **プライバシー**: 完全 private inference には「private」モデルを選ぶ
- **機能性**: Venice のプロキシ経由で Claude、GPT、Gemini にアクセスするには「anonymized」モデルを選ぶ

デフォルトモデルはいつでも変更できます:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

利用可能な全モデルを一覧表示:

```bash
openclaw models list | grep venice
```

または `openclaw configure` を実行し、**Model/auth** を選んで **Venice AI** を選択することもできます。

<Tip>
用途に合うモデルを選ぶには、下の表を使ってください。

| 用途                       | 推奨モデル                         | 理由                                           |
| -------------------------- | ---------------------------------- | ---------------------------------------------- |
| **一般チャット（デフォルト）** | `kimi-k2-5`                        | 強い private reasoning と vision               |
| **総合品質最優先**         | `claude-opus-4-6`                  | 最強の anonymized Venice オプション            |
| **プライバシー + コーディング** | `qwen3-coder-480b-a35b-instruct`   | 大きなコンテキストを持つ private coding モデル |
| **Private vision**         | `kimi-k2-5`                        | private mode のまま vision 対応                |
| **高速 + 安価**            | `qwen3-4b`                         | 軽量な reasoning モデル                        |
| **複雑な private タスク**  | `deepseek-v3.2`                    | 強い reasoning。ただし Venice のツールサポートなし |
| **Uncensored**             | `venice-uncensored`                | コンテンツ制限なし                             |

</Tip>

## 組み込みカタログ（全 41 件）

<AccordionGroup>
  <Accordion title="Private モデル（26）— 完全 private、ログなし">
    | モデル ID                               | 名前                                | コンテキスト | 機能                       |
    | -------------------------------------- | ----------------------------------- | ------------ | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k         | デフォルト、reasoning、vision |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k         | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k         | General                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k         | General                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k         | General、tools disabled    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k         | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k         | General                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k         | Coding                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k         | Coding                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k         | Reasoning、vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k         | General                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B（Vision）             | 256k         | Vision                     |
    | `qwen3-4b`                             | Venice Small（Qwen3 4B）            | 32k          | Fast、reasoning            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k         | Reasoning、tools disabled  |
    | `venice-uncensored`                    | Venice Uncensored（Dolphin-Mistral） | 32k          | Uncensored、tools disabled |
    | `mistral-31-24b`                       | Venice Medium（Mistral）            | 128k         | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k         | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k         | General                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k         | General                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k         | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k         | General                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k         | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k         | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                               | 198k         | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k         | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k         | Reasoning                  |
  </Accordion>

  <Accordion title="Anonymized モデル（15）— Venice プロキシ経由">
    | モデル ID                        | 名前                           | コンテキスト | 機能                       |
    | ------------------------------- | ------------------------------ | ------------ | -------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6（via Venice）   | 1M           | Reasoning、vision          |
    | `claude-opus-4-5`               | Claude Opus 4.5（via Venice）   | 198k         | Reasoning、vision          |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6（via Venice） | 1M           | Reasoning、vision          |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5（via Venice） | 198k         | Reasoning、vision          |
    | `openai-gpt-54`                 | GPT-5.4（via Venice）           | 1M           | Reasoning、vision          |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex（via Venice）     | 400k         | Reasoning、vision、coding  |
    | `openai-gpt-52`                 | GPT-5.2（via Venice）           | 256k         | Reasoning                  |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex（via Venice）     | 256k         | Reasoning、vision、coding  |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o（via Venice）            | 128k         | Vision                     |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（via Venice）       | 128k         | Vision                     |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro（via Venice）    | 1M           | Reasoning、vision          |
    | `gemini-3-pro-preview`          | Gemini 3 Pro（via Venice）      | 198k         | Reasoning、vision          |
    | `gemini-3-flash-preview`        | Gemini 3 Flash（via Venice）    | 256k         | Reasoning、vision          |
    | `grok-41-fast`                  | Grok 4.1 Fast（via Venice）     | 1M           | Reasoning、vision          |
    | `grok-code-fast-1`              | Grok Code Fast 1（via Venice）  | 256k         | Reasoning、coding          |
  </Accordion>
</AccordionGroup>

## モデル検出

`VENICE_API_KEY` が設定されている場合、OpenClaw は Venice API からモデルを自動検出します。API に到達できない場合は静的カタログへフォールバックします。

`/models` エンドポイントは public です（一覧表示に認証不要）が、推論には有効な API キーが必要です。

## ストリーミングとツールサポート

| 機能                 | サポート                                              |
| -------------------- | ----------------------------------------------------- |
| **ストリーミング**   | すべてのモデル                                        |
| **Function calling** | 大半のモデル（API の `supportsFunctionCalling` を確認） |
| **Vision / Images**  | 「Vision」機能が付いたモデル                          |
| **JSON mode**        | `response_format` 経由で対応                          |

## 料金

Venice は credit ベースのシステムを使います。現在の料金は [venice.ai/pricing](https://venice.ai/pricing) を確認してください:

- **Private モデル**: 一般に低コスト
- **Anonymized モデル**: 直接 API 料金 + 小さな Venice 手数料に近い

### Venice（anonymized）と直接 API の比較

| 項目         | Venice（Anonymized）            | 直接 API            |
| ------------ | ------------------------------- | ------------------- |
| **プライバシー** | メタデータ削除、匿名化          | あなたのアカウントに紐付く |
| **レイテンシ** | +10〜50ms（プロキシ分）         | 直接                |
| **機能**     | 大半の機能をサポート             | 完全な機能           |
| **課金**     | Venice credits                  | プロバイダ課金       |

## 使用例

```bash
# デフォルトの private モデルを使う
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Venice 経由で Claude Opus を使う（anonymized）
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# uncensored モデルを使う
openclaw agent --model venice/venice-uncensored --message "Draft options"

# vision モデルを画像付きで使う
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# coding モデルを使う
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="API キーが認識されない">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    キーが `vapi_` で始まっていることを確認してください。

  </Accordion>

  <Accordion title="モデルが利用できない">
    Venice のモデルカタログは動的に更新されます。現在利用可能なモデルを見るには `openclaw models list` を実行してください。モデルによっては一時的にオフラインのことがあります。
  </Accordion>

  <Accordion title="接続問題">
    Venice API は `https://api.venice.ai/api/v1` にあります。ネットワークが HTTPS 接続を許可していることを確認してください。
  </Accordion>
</AccordionGroup>

<Note>
さらに支援が必要なら: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定ファイル例">
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
    プロバイダ、モデル参照、failover 動作の選び方。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI ホームページとアカウント登録。
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Venice API リファレンスと開発者ドキュメント。
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    現在の Venice credit 料金とプラン。
  </Card>
</CardGroup>
