---
read_when:
    - OpenAI model を OpenClaw で使いたい場合
    - API キーではなく Codex サブスクリプション認証を使いたい場合
    - より厳格な GPT-5 エージェント実行動作が必要な場合
summary: API キーまたは Codex サブスクリプションを使って OpenClaw で OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T04:50:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9ed926ed4d3cd7a0fd4e9e9859fcd81ab62134de625ccf0c66fc92c4273449f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI は GPT model 向けの開発者 API を提供しています。OpenClaw は 2 つの認証ルートをサポートします。

- **API key** — 従量課金の直接 OpenAI Platform アクセス（`openai/*` model）
- **Codex subscription** — サブスクリプションアクセス付きの ChatGPT/Codex サインイン（`openai-codex/*` model）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最適な用途:** 直接 API アクセスと従量課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="model が利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex サインインは `openai/*` ではなく `openai-codex/*` 経由でルーティングされます。
    </Note>

    ### config 例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw は直接 API ルートでは `openai/gpt-5.3-codex-spark` を **公開しません**。実際の OpenAI API リクエストではその model は拒否されます。Spark は Codex 専用です。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 別の API キーではなく、ChatGPT/Codex サブスクリプションを使うこと。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します。

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="デフォルト model を設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="model が利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex サインイン（entitlement に依存） |

    <Note>
    このルートは意図的に `openai/gpt-5.4` と分離されています。直接 Platform アクセスには API キー付きの `openai/*` を使い、Codex サブスクリプションアクセスには `openai-codex/*` を使ってください。
    </Note>

    ### config 例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    オンボーディングで既存の Codex CLI ログインを再利用した場合、その credential は引き続き Codex CLI によって管理されます。有効期限切れ時には、OpenClaw はまず外部の Codex ソースを再読込し、更新された credential を Codex ストレージに書き戻します。
    </Tip>

    ### コンテキストウィンドウ上限

    OpenClaw は model メタデータとランタイムのコンテキスト上限を別々の値として扱います。

    `openai-codex/gpt-5.4` では:

    - ネイティブ `contextWindow`: `1050000`
    - デフォルトのランタイム `contextTokens` 上限: `272000`

    より小さいデフォルト上限のほうが、実運用ではレイテンシと品質の特性が良好です。`contextTokens` で上書きできます。

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブ model メタデータを宣言するには `contextWindow` を使用します。ランタイムのコンテキスト予算を制限するには `contextTokens` を使用します。
    </Note>

  </Tab>
</Tabs>

## 画像生成

同梱の `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。

| Capability | 値 |
| ------------------------- | ---------------------------------- |
| デフォルト model | `openai/gpt-image-1` |
| 1 リクエストあたりの最大画像数 | 4 |
| 編集モード | 有効（最大 5 枚の参照画像） |
| サイズ上書き | サポートあり |
| アスペクト比 / 解像度 | OpenAI Images API には転送されない |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
共有ツールパラメータ、provider 選択、failover 動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

同梱の `openai` Plugin は、`video_generate` ツールを通じて動画生成を登録します。

| Capability | 値 |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルト model | `openai/sora-2` |
| モード | text-to-video、image-to-video、single-video edit |
| 参照入力 | 画像 1 枚または動画 1 本 |
| サイズ上書き | サポートあり |
| その他の上書き | `aspectRatio`, `resolution`, `audio`, `watermark` はツール警告付きで無視される |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
共有ツールパラメータ、provider 選択、failover 動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 prompt contribution

OpenClaw は、`openai/*` および `openai-codex/*` の GPT-5 系実行に対して、OpenAI 固有の GPT-5 prompt contribution を追加します。これは同梱の OpenAI Plugin 内にあり、`gpt-5`、`gpt-5.2`、`gpt-5.4`、`gpt-5.4-mini` のような model id に適用され、古い GPT-4.x model には適用されません。

GPT-5 contribution は、出力形式、ツール継続性、依存関係チェック、並列参照、完了チェック、検証、自律性についてのタグ付き挙動契約をデフォルトで追加します。そのガイダンスは、一致する GPT-5 model に対して常に有効です。親しみやすい対話スタイル層は別になっており、設定可能です。

| 値 | 効果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (デフォルト) | 親しみやすい対話スタイル層を有効にする |
| `"on"` | `"friendly"` の alias |
| `"off"` | 親しみやすいスタイル層のみを無効にする |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
値はランタイムでは大文字小文字を区別しないため、`"Off"` と `"off"` はどちらも親しみやすいスタイル層を無効にします。
</Tip>

## 音声と speech

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    同梱の `openai` Plugin は、`messages.tts` サーフェス向けに音声合成を登録します。

    | 設定 | config パス | デフォルト |
    |---------|------------|---------|
    | model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | voice | `messages.tts.providers.openai.voice` | `coral` |
    | speed | `messages.tts.providers.openai.speed` | （未設定） |
    | instructions | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | format | `messages.tts.providers.openai.responseFormat` | ボイスノートは `opus`、ファイルは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能な model: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な voice: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    チャット API endpoint に影響を与えずに TTS の base URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    同梱の `openai` Plugin は、Voice Call Plugin 向けにリアルタイム文字起こしを登録します。

    | 設定 | config パス | デフォルト |
    |---------|------------|---------|
    | model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続と G.711 u-law 音声を使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    同梱の `openai` Plugin は、Voice Call Plugin 向けにリアルタイム音声を登録します。

    | 設定 | config パス | デフォルト |
    |---------|------------|---------|
    | model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | voice | `...openai.voice` | `alloy` |
    | temperature | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` および `azureDeployment` config key により Azure OpenAI をサポートします。双方向のツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket vs SSE）">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方で、WebSocket 優先かつ SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次のように動作します。
    - 初期の WebSocket 失敗を 1 回再試行してから SSE にフォールバックする
    - 失敗後は WebSocket を約 60 秒間 degraded と見なし、cool-down 中は SSE を使う
    - 再試行および再接続のために安定した session と turn の identity header を付与する
    - transport バリアント間で usage counter（`input_tokens` / `prompt_tokens`）を正規化する

    | 値 | 動作 |
    |-------|----------|
    | `"auto"` (デフォルト) | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみを強制 |
    | `"websocket"` | WebSocket のみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    関連する OpenAI ドキュメント:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket ウォームアップ">
    OpenClaw は、最初のターンのレイテンシを減らすために、`openai/*` でデフォルトで WebSocket ウォームアップを有効にしています。

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="高速モード">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方に共通の高速モード切り替えを提供します。

    - **チャット/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効化すると、OpenClaw は高速モードを OpenAI の優先処理（`service_tier = "priority"`）にマッピングします。既存の `service_tier` 値は保持され、fast mode は `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    セッション上書きは config より優先されます。Sessions UI でセッション上書きをクリアすると、そのセッションは設定されたデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI API は `service_tier` を通じて優先処理を提供します。OpenClaw では model ごとに設定できます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier` はネイティブ OpenAI endpoint（`api.openai.com`）とネイティブ Codex endpoint（`chatgpt.com/backend-api`）にのみ転送されます。いずれかの provider を proxy 経由でルーティングする場合、OpenClaw は `service_tier` に手を加えません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction（Responses API）">
    直接 OpenAI Responses model（`api.openai.com` 上の `openai/*`）では、OpenClaw はサーバー側 Compaction を自動有効化します。

    - `store: true` を強制する（model compat で `supportsStore: false` が設定されていない限り）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入する
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（不明な場合は `80000`）

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換 endpoint で有用です。

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタムしきい値">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="無効化">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` が制御するのは `context_management` の注入だけです。直接 OpenAI Responses model では、compat で `supportsStore: false` が設定されていない限り、引き続き `store: true` が強制されます。
    </Note>

  </Accordion>

  <Accordion title="strict-agentic GPT モード">
    `openai/*` および `openai-codex/*` の GPT-5 系実行では、OpenClaw はより厳格な埋め込み実行契約を使えます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次のように動作します。
    - ツールアクションが可能な場合、plan-only のターンを成功した進捗としては扱わない
    - act-now steer を付けてそのターンを再試行する
    - 実質的な作業では `update_plan` を自動有効化する
    - model が行動せずに計画し続ける場合、明示的な blocked 状態を表示する

    <Note>
    対象は OpenAI および Codex の GPT-5 系実行のみです。他の provider や古い model 系ではデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルート vs OpenAI 互換ルート">
    OpenClaw は、直接 OpenAI、Codex、Azure OpenAI の endpoint を、汎用の OpenAI 互換 `/v1` proxy とは異なる扱いにします。

    **ネイティブルート**（`openai/*`、`openai-codex/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートする model に対してのみ `reasoning: { effort: "none" }` を保持する
    - `reasoning.effort: "none"` を拒否する model や proxy に対しては、無効化された reasoning を省略する
    - ツール schema をデフォルトで strict mode にする
    - 検証済みのネイティブ host に対してのみ非表示の attribution header を付与する
    - OpenAI 専用の request shaping（`service_tier`、`store`、reasoning-compat、prompt-cache hint）を維持する

    **proxy/互換ルート:**
    - より緩い compat 動作を使う
    - strict なツール schema やネイティブ専用 header を強制しない

    Azure OpenAI はネイティブ transport と compat 動作を使いますが、非表示の attribution header は受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="model 選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover 動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメータと provider 選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメータと provider 選択。
  </Card>
  <Card title="OAuth と auth" href="/ja-JP/gateway/authentication" icon="key">
    auth の詳細と credential 再利用ルール。
  </Card>
</CardGroup>
