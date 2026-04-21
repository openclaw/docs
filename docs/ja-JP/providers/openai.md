---
read_when:
    - OpenClaw で OpenAI モデルを使いたい場合
    - API キーではなく Codex サブスクリプション認証を使いたい場合
    - より厳格な GPT-5 エージェント実行動作が必要な場合
summary: OpenClaw で API キーまたは Codex サブスクリプションを使って OpenAI を利用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T13:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI は GPT モデル向けの開発者 API を提供しています。OpenClaw は 2 つの認証ルートをサポートしています。

- **API キー** — 従量課金の直接 OpenAI Platform アクセス（`openai/*` モデル）
- **Codex サブスクリプション** — サブスクリプションアクセスを使う ChatGPT/Codex サインイン（`openai-codex/*` モデル）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

## はじめに

希望する認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー (OpenAI Platform)">
    **最適な用途:** 直接 API アクセスと従量課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) で API キーを作成またはコピーします。
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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex サインインは `openai/*` ではなく `openai-codex/*` 経由でルーティングされます。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw は直接 API ルートでは `openai/gpt-5.3-codex-spark` を公開していません。実際の OpenAI API リクエストではそのモデルは拒否されます。Spark は Codex 専用です。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
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
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex サインイン |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex サインイン（権利に依存） |

    <Note>
    このルートは `openai/gpt-5.4` とは意図的に分けられています。直接 Platform アクセスには API キー付きの `openai/*` を使い、Codex サブスクリプションアクセスには `openai-codex/*` を使ってください。
    </Note>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    オンボーディングが既存の Codex CLI ログインを再利用する場合、その認証情報は Codex CLI によって管理されたままになります。有効期限が切れると、OpenClaw はまず外部の Codex ソースを再読み込みし、更新された認証情報を Codex ストレージに書き戻します。
    </Tip>

    ### コンテキストウィンドウ上限

    OpenClaw はモデルメタデータとランタイムのコンテキスト上限を別の値として扱います。

    `openai-codex/gpt-5.4` では:

    - ネイティブ `contextWindow`: `1050000`
    - デフォルトのランタイム `contextTokens` 上限: `272000`

    実運用では、このより小さいデフォルト上限のほうがレイテンシと品質の特性が良好です。`contextTokens` で上書きできます。

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
    ネイティブモデルメタデータを宣言するには `contextWindow` を使います。ランタイムのコンテキスト予算を制限するには `contextTokens` を使います。
    </Note>

  </Tab>
</Tabs>

## 画像生成

同梱の `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。

| Capability                | Value                              |
| ------------------------- | ---------------------------------- |
| デフォルトモデル          | `openai/gpt-image-1`               |
| リクエストあたりの最大画像数 | 4                                  |
| 編集モード                | 有効（最大 5 枚の参照画像まで）    |
| サイズ上書き              | 対応                               |
| アスペクト比 / 解像度     | OpenAI Images API には転送されません |

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
共通のツールパラメータ、プロバイダー選択、フェイルオーバー動作については [画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

## 動画生成

同梱の `openai` Plugin は、`video_generate` ツールを通じて動画生成を登録します。

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2`                                                                   |
| モード           | テキストから動画、画像から動画、単一動画の編集                                   |
| 参照入力         | 画像 1 枚または動画 1 本                                                          |
| サイズ上書き     | 対応                                                                              |
| その他の上書き   | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

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
共通のツールパラメータ、プロバイダー選択、フェイルオーバー動作については [動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 プロンプト寄与

OpenClaw は、`openai/*` および `openai-codex/*` の GPT-5 ファミリー実行に対して、OpenAI 固有の GPT-5 プロンプト寄与を追加します。これは同梱の OpenAI Plugin 内にあり、`gpt-5`、`gpt-5.2`、`gpt-5.4`、`gpt-5.4-mini` などのモデル ID に適用され、古い GPT-4.x モデルには適用されません。

GPT-5 の寄与は、ペルソナ維持、実行安全性、ツール規律、出力形状、完了チェック、検証のためのタグ付き動作契約を追加します。チャンネル固有の返信動作や silent-message 動作は、共有の OpenClaw システムプロンプトと送信配信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルでは常に有効です。フレンドリーな対話スタイル層はこれとは別で、設定可能です。

| Value                  | Effect                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（デフォルト） | フレンドリーな対話スタイル層を有効にする |
| `"on"`                 | `"friendly"` の別名                         |
| `"off"`                | フレンドリースタイル層のみ無効にする       |

<Tabs>
  <Tab title="設定">
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
値はランタイムでは大文字小文字を区別しないため、`"Off"` と `"off"` はどちらもフレンドリースタイル層を無効にします。
</Tip>

## 音声とスピーチ

<AccordionGroup>
  <Accordion title="音声合成 (TTS)">
    同梱の `openai` Plugin は、`messages.tts` サーフェス向けに音声合成を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | ボイスノートは `opus`、ファイルは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なモデル: `gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。利用可能な音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

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
    チャット API エンドポイントに影響を与えずに TTS の Base URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    同梱の `openai` Plugin は、Voice Call Plugin 向けにリアルタイム文字起こしを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    G.711 u-law 音声を使って `wss://api.openai.com/v1/realtime` への WebSocket 接続を使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    同梱の `openai` Plugin は、Voice Call Plugin 向けにリアルタイム音声を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | 音声 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` および `azureDeployment` 設定キーによる Azure OpenAI をサポートします。双方向のツール呼び出しに対応しています。G.711 u-law 音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート (WebSocket vs SSE)">
    OpenClaw は `openai/*` と `openai-codex/*` の両方で、WebSocket 優先かつ SSE フォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - SSE にフォールバックする前に、初期の WebSocket 失敗を 1 回再試行する
    - 失敗後、WebSocket を約 60 秒間劣化状態としてマークし、クールダウン中は SSE を使用する
    - 再試行および再接続のために、安定したセッションおよびターン ID ヘッダーを付与する
    - トランスポート差異をまたいで使用量カウンタ（`input_tokens` / `prompt_tokens`）を正規化する

    | Value | Behavior |
    |-------|----------|
    | `"auto"`（デフォルト） | WebSocket 優先、SSE フォールバック |
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
    OpenClaw は、最初のターンのレイテンシを減らすために、`openai/*` でデフォルトで WebSocket ウォームアップを有効にします。

    ```json5
    // ウォームアップを無効化
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

  <Accordion title="fast モード">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方に共通の fast モード切り替えを提供します。

    - **チャット/UI:** `/fast status|on|off`
    - **設定:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は fast モードを OpenAI の優先処理（`service_tier = "priority"`）にマップします。既存の `service_tier` 値は保持され、fast モードは `reasoning` や `text.verbosity` を書き換えません。

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
    セッション上書きは設定より優先されます。Sessions UI でセッション上書きをクリアすると、そのセッションは設定済みデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理 (service_tier)">
    OpenAI の API は `service_tier` による優先処理を公開しています。OpenClaw ではモデルごとに設定できます。

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

    サポートされる値: `auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` はネイティブ OpenAI エンドポイント（`api.openai.com`）およびネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。いずれかのプロバイダーをプロキシ経由でルーティングする場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバー側 Compaction (Responses API)">
    直接 OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenClaw はサーバー側 Compaction を自動有効化します。

    - `store: true` を強制します（モデル compat が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入します
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（不明な場合は `80000`）

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントで便利です。

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
    `responsesServerCompaction` は `context_management` の注入だけを制御します。直接 OpenAI Responses モデルでは、compat が `supportsStore: false` を設定しない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="strict-agentic GPT モード">
    `openai/*` および `openai-codex/*` での GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

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
    - ツールアクションが利用可能な場合、プランのみのターンを成功した進捗として扱わなくなります
    - act-now 誘導付きでターンを再試行します
    - 大きな作業では `update_plan` を自動有効化します
    - モデルが行動せず計画を続ける場合、明示的な blocked 状態を表示します

    <Note>
    OpenAI および Codex の GPT-5 ファミリー実行のみに適用されます。他のプロバイダーや古いモデルファミリーではデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="ネイティブルートと OpenAI 互換ルート">
    OpenClaw は、直接 OpenAI、Codex、Azure OpenAI のエンドポイントを、汎用的な OpenAI 互換 `/v1` プロキシとは別扱いします。

    **ネイティブルート**（`openai/*`、`openai-codex/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を維持します
    - `reasoning.effort: "none"` を拒否するモデルやプロキシでは、無効化された reasoning を省略します
    - ツールスキーマはデフォルトで strict モードにします
    - 検証済みネイティブホストにのみ非表示の attribution ヘッダーを付与します
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning-compat、prompt-cache ヒント）を維持します

    **プロキシ/互換ルート:**
    - より緩い compat 動作を使います
    - strict なツールスキーマやネイティブ専用ヘッダーを強制しません

    Azure OpenAI はネイティブトランスポートと compat 動作を使用しますが、非表示の attribution ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメータとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメータとプロバイダー選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
