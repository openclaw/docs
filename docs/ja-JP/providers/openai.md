---
read_when:
    - OpenClaw で OpenAI モデルを使用したい
    - API キーではなく Codex サブスクリプション認証を使用したい
    - より厳格な GPT-5 のエージェント実行動作が必要です
summary: OpenClaw で API キーまたは Codex サブスクリプション経由で OpenAI を使用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI は GPT モデル向けの developer API を提供しています。OpenClaw は OpenAI ファミリーの 3 つのルートをサポートしています。モデルのプレフィックスでルートを選択します。

- **API キー** — 使用量ベース課金による直接の OpenAI Platform アクセス（`openai/*` モデル）
- **PI 経由の Codex サブスクリプション** — サブスクリプションアクセスを使う ChatGPT/Codex サインイン（`openai-codex/*` モデル）
- **Codex app-server harness** — ネイティブの Codex app-server 実行（`openai/*` モデル + `agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAI は、OpenClaw のような外部ツールやワークフローでのサブスクリプション OAuth 利用を明示的にサポートしています。

プロバイダー、モデル、ランタイム、チャネルはそれぞれ別のレイヤーです。これらのラベルが混同されている場合は、設定を変更する前に [Agent runtimes](/ja-JP/concepts/agent-runtimes) を読んでください。

## クイック選択

| 目的 | 使用方法 | 注記 |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 直接の API キー課金 | `openai/gpt-5.5` | `OPENAI_API_KEY` を設定するか、OpenAI API キーのオンボーディングを実行します。 |
| ChatGPT/Codex サブスクリプション認証で GPT-5.5 を使う | `openai-codex/gpt-5.5` | Codex OAuth 用のデフォルト PI ルートです。サブスクリプション構成では最初の選択肢として最適です。 |
| ネイティブ Codex app-server 動作で GPT-5.5 を使う | `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"` | そのモデル参照に対して Codex app-server harness を強制します。 |
| 画像生成または編集 | `openai/gpt-image-2` | `OPENAI_API_KEY` と OpenAI Codex OAuth のどちらでも動作します。 |

<Note>
GPT-5.5 は、直接の OpenAI Platform API キーアクセスと、サブスクリプション/OAuth ルートの両方で利用できます。直接の `OPENAI_API_KEY` 通信には `openai/gpt-5.5` を、PI 経由の Codex OAuth には `openai-codex/gpt-5.5` を、ネイティブ Codex app-server harness には `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"` を使用してください。
</Note>

<Note>
OpenAI Plugin を有効にしても、または `openai-codex/*` モデルを選択しても、同梱の Codex app-server Plugin は有効になりません。OpenClaw がその Plugin を有効にするのは、`embeddedHarness.runtime: "codex"` でネイティブ Codex harness を明示的に選択した場合、または従来の `codex/*` モデル参照を使用した場合だけです。
</Note>

## OpenClaw の機能カバレッジ

| OpenAI の機能 | OpenClaw のサーフェス | 状態 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses | `openai/<model>` モデルプロバイダー | はい |
| Codex サブスクリプションモデル | `openai-codex/<model>` と `openai-codex` OAuth | はい |
| Codex app-server harness | `openai/<model>` と `embeddedHarness.runtime: codex` | はい |
| サーバー側 Web 検索 | ネイティブ OpenAI Responses ツール | はい、Web 検索が有効でプロバイダー固定がない場合 |
| 画像 | `image_generate` | はい |
| 動画 | `video_generate` | はい |
| Text-to-speech | `messages.tts.provider: "openai"` / `tts` | はい |
| バッチ speech-to-text | `tools.media.audio` / メディア理解 | はい |
| ストリーミング speech-to-text | Voice Call `streaming.provider: "openai"` | はい |
| リアルタイム音声 | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい |
| 埋め込み | メモリ埋め込みプロバイダー | はい |

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API キー（OpenAI Platform）">
    **最適な用途:** 直接 API アクセスと使用量ベース課金。

    <Steps>
      <Step title="API キーを取得する">
        [OpenAI Platform ダッシュボード](https://platform.openai.com/api-keys) で API キーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai/gpt-5.5` | 直接の OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 直接の OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` は、Codex app-server harness を明示的に強制しない限り、直接の OpenAI API キールートです。デフォルトの PI ランナー経由の Codex OAuth には `openai-codex/*` を使用し、ネイティブ Codex app-server 実行には `openai/gpt-5.5` と `embeddedHarness.runtime: "codex"` を使用してください。
    </Note>

    ### 設定例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw は **`openai/gpt-5.3-codex-spark` を公開していません**。ライブの OpenAI API リクエストはそのモデルを拒否し、現在の Codex カタログでも公開されていません。
    </Warning>

  </Tab>

  <Tab title="Codex サブスクリプション">
    **最適な用途:** 別個の API キーではなく、ChatGPT/Codex サブスクリプションを使うこと。Codex cloud には ChatGPT サインインが必要です。

    <Steps>
      <Step title="Codex OAuth を実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuth を直接実行します:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックに厳しい環境では、localhost ブラウザーコールバックの代わりに ChatGPT の device-code フローでサインインするため、`--device-code` を追加してください:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | ルート | 認証 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | PI 経由の ChatGPT/Codex OAuth | Codex サインイン |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server 認証 |

    <Note>
    認証/プロファイルコマンドでは、引き続き `openai-codex` プロバイダー ID を使用してください。`openai-codex/*` モデルプレフィックスも、Codex OAuth 用の明示的な PI ルートです。これは、同梱の Codex app-server harness を選択したり自動有効化したりするものではありません。
    </Note>

    ### 設定例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    オンボーディングは、`~/.codex` から OAuth 情報をインポートしなくなりました。ブラウザー OAuth（デフォルト）または上記の device-code フローでサインインしてください。OpenClaw は生成された認証情報を独自のエージェント auth store で管理します。
    </Note>

    ### ステータス表示

    Chat の `/status` は、現在のセッションでどのモデルランタイムが有効かを表示します。デフォルトの PI harness は `Runtime: OpenClaw Pi Default` と表示されます。同梱の Codex app-server harness が選択されている場合、`/status` は `Runtime: OpenAI Codex` と表示します。既存のセッションは記録済みの harness id を保持するため、`embeddedHarness` を変更したあとに `/status` に新しい PI/Codex の選択を反映したい場合は `/new` または `/reset` を使用してください。

    ### コンテキストウィンドウ上限

    OpenClaw は、モデルメタデータと実行時コンテキスト上限を別の値として扱います。

    Codex OAuth 経由の `openai-codex/gpt-5.5` では:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトの実行時 `contextTokens` 上限: `272000`

    このより小さいデフォルト上限は、実運用ではレイテンシと品質の特性がより良好です。`contextTokens` で上書きできます:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブモデルのメタデータを宣言するには `contextWindow` を使用してください。実行時コンテキスト予算を制限するには `contextTokens` を使用してください。
    </Note>

    ### カタログの回復

    OpenClaw は、存在する場合は `gpt-5.5` に対してアップストリーム Codex カタログメタデータを使用します。アカウントが認証済みであるにもかかわらず、ライブの Codex 検出で `openai-codex/gpt-5.5` 行が省略された場合、OpenClaw はその OAuth モデル行を合成し、Cron、sub-agent、および設定済みデフォルトモデルの実行が `Unknown model` で失敗しないようにします。

  </Tab>
</Tabs>

## 画像生成

同梱の `openai` Plugin は、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` モデル参照で、OpenAI API キーによる画像生成と Codex OAuth による画像生成の両方をサポートします。

| 機能 | OpenAI API キー | Codex OAuth |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| モデル参照 | `openai/gpt-image-2` | `openai/gpt-image-2` |
| 認証 | `OPENAI_API_KEY` | OpenAI Codex OAuth サインイン |
| トランスポート | OpenAI Images API | Codex Responses バックエンド |
| リクエストあたりの最大画像数 | 4 | 4 |
| 編集モード | 有効（最大 5 枚の参照画像まで） | 有効（最大 5 枚の参照画像まで） |
| サイズ上書き | サポート、2K/4K サイズを含む | サポート、2K/4K サイズを含む |
| アスペクト比 / 解像度 | OpenAI Images API には転送されない | 安全な場合はサポートされるサイズへマッピングされる |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAI の text-to-image 生成と画像編集の両方でデフォルトです。`gpt-image-1` も明示的なモデル上書きとして引き続き使用できますが、新しい OpenAI 画像ワークフローでは `openai/gpt-image-2` を使用してください。

Codex OAuth を使うインストールでは、同じ `openai/gpt-image-2` 参照をそのまま使用してください。`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は保存されたその OAuth アクセストークンを解決し、Codex Responses バックエンド経由で画像リクエストを送信します。そのリクエストについて、最初に `OPENAI_API_KEY` を試したり、API キーへ黙ってフォールバックしたりはしません。代わりに直接の OpenAI Images API ルートを使いたい場合は、API キー、カスタムベース URL、または Azure エンドポイントを使って `models.providers.openai` を明示的に設定してください。
そのカスタム画像エンドポイントが信頼された LAN/プライベートアドレス上にある場合は、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。このオプトインがない限り、OpenClaw はプライベート/内部の OpenAI 互換画像エンドポイントをブロックしたままにします。

生成:

```text
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

編集:

```text
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

同梱の `openai` Plugin は、`video_generate` ツールを通じて動画生成を登録します。

| 機能 | 値 |
| ---------------- | --------------------------------------------------------------------------------- |
| デフォルトモデル | `openai/sora-2` |
| モード | text-to-video、image-to-video、単一動画編集 |
| 参照入力 | 画像 1 枚または動画 1 本 |
| サイズ上書き | サポート |
| その他の上書き | `aspectRatio`、`resolution`、`audio`、`watermark` はツール警告付きで無視されます |

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5 のプロンプト寄与

OpenClaw は、プロバイダーをまたぐ GPT-5 ファミリー実行向けに、共有の GPT-5 プロンプト寄与を追加します。これはモデル ID ごとに適用されるため、`openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5`、およびその他の互換 GPT-5 参照には同じオーバーレイが適用されます。古い GPT-4.x モデルには適用されません。

同梱のネイティブ Codex harness は、Codex app-server developer instructions を通じて同じ GPT-5 動作と Heartbeat オーバーレイを使用するため、`embeddedHarness.runtime: "codex"` で強制された `openai/gpt-5.x` セッションでも、harness プロンプトの残りを Codex が所有していても、同じ follow-through と proactive Heartbeat ガイダンスが維持されます。

GPT-5 寄与は、persona 維持、実行安全性、ツール規律、出力形状、完了チェック、検証のためのタグ付き動作契約を追加します。チャネル固有の応答と silent-message 動作は、共有の OpenClaw システムプロンプトと送信ポリシーに残ります。GPT-5 ガイダンスは、一致するモデルでは常に有効です。フレンドリーな対話スタイル層は別で、設定可能です。

| 値 | 効果 |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (デフォルト) | フレンドリーな対話スタイル層を有効化 |
| `"on"` | `"friendly"` の別名 |
| `"off"` | フレンドリーなスタイル層のみ無効化 |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
実行時には値の大文字小文字は区別されないため、`"Off"` でも `"off"` でもフレンドリーなスタイル層は無効になります。
</Tip>

<Note>
共有の `agents.defaults.promptOverlays.gpt5.personality` 設定が未設定の場合、従来の `plugins.entries.openai.config.personality` は引き続き互換フォールバックとして読み取られます。
</Note>

## 音声と speech

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    同梱の `openai` Plugin は、`messages.tts` サーフェス向けに音声合成を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音声 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未設定） |
    | 指示 | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | 形式 | `messages.tts.providers.openai.responseFormat` | 音声ノートでは `opus`、ファイルでは `mp3` |
    | API キー | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | ベース URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Chat API エンドポイントに影響を与えずに TTS のベース URL を上書きするには、`OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    同梱の `openai` Plugin は、
    OpenClaw の media-understanding transcription サーフェスを通じてバッチ speech-to-text を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力パス: multipart 音声ファイルアップロード
    - OpenClaw で、受信音声文字起こしが `tools.media.audio` を使うすべての場所でサポートされます。これには Discord 音声チャネルのセグメントやチャネル音声添付が含まれます

    受信音声文字起こしに OpenAI を強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    言語とプロンプトのヒントは、共有音声メディア設定または呼び出しごとの transcription リクエストで指定された場合、OpenAI に転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    同梱の `openai` Plugin は、Voice Call Plugin 向けにリアルタイム文字起こしを登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 言語 | `...openai.language` | （未設定） |
    | プロンプト | `...openai.prompt` | （未設定） |
    | 無音時間 | `...openai.silenceDurationMs` | `800` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` への WebSocket 接続と G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を使用します。この streaming プロバイダーは Voice Call のリアルタイム文字起こしパス向けです。Discord 音声は現在、短いセグメントを録音し、代わりにバッチの `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    同梱の `openai` Plugin は、Voice Call Plugin 向けにリアルタイム音声を登録します。

    | 設定 | 設定パス | デフォルト |
    |---------|------------|---------|
    | モデル | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 音声 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD しきい値 | `...openai.vadThreshold` | `0.5` |
    | 無音時間 | `...openai.silenceDurationMs` | `500` |
    | API キー | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` と `azureDeployment` の設定キーにより Azure OpenAI をサポートします。双方向ツール呼び出しをサポートします。G.711 u-law 音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI エンドポイント

同梱の `openai` プロバイダーは、ベース URL を上書きすることで画像生成を Azure OpenAI リソースへ向けられます。画像生成パスでは、OpenClaw は `models.providers.openai.baseUrl` 上の Azure ホスト名を検出し、自動的に Azure のリクエスト形状へ切り替えます。

<Note>
リアルタイム音声は別の設定パス
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）を使用し、`models.providers.openai.baseUrl` の影響を受けません。Azure 設定については、[音声と speech](#voice-and-speech) の **リアルタイム音声** アコーディオンを参照してください。
</Note>

次の場合は Azure OpenAI を使用してください。

- すでに Azure OpenAI のサブスクリプション、クォータ、またはエンタープライズ契約がある
- Azure が提供するリージョンデータ常駐またはコンプライアンス制御が必要
- 既存の Azure テナンシー内にトラフィックを維持したい

### 設定

同梱の `openai` プロバイダー経由で Azure 画像生成を使うには、
`models.providers.openai.baseUrl` を Azure リソースに向け、`apiKey` には
OpenAI Platform キーではなく Azure OpenAI キーを設定します:

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw は、Azure 画像生成ルートとして以下の Azure ホストサフィックスを認識します。

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識された Azure ホストに対する画像生成リクエストでは、OpenClaw は次を行います。

- `Authorization: Bearer` ではなく `api-key` ヘッダーを送信する
- デプロイメントスコープのパス（`/openai/deployments/{deployment}/...`）を使用する
- 各リクエストに `?api-version=...` を追加する

その他のベース URL（公開 OpenAI、OpenAI 互換プロキシ）では、標準の OpenAI 画像リクエスト形状が維持されます。

<Note>
`openai` プロバイダーの画像生成パスに対する Azure ルーティングには
OpenClaw 2026.4.22 以降が必要です。以前のバージョンでは、カスタム
`openai.baseUrl` はすべて公開 OpenAI エンドポイントのように扱われるため、
Azure 画像デプロイメントに対して失敗します。
</Note>

### API バージョン

Azure 画像生成パスに特定の Azure preview または GA バージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定してください:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名はデプロイメント名

Azure OpenAI はモデルをデプロイメントに結び付けます。同梱の `openai` プロバイダー経由でルーティングされる Azure 画像生成リクエストでは、OpenClaw の `model` フィールドは公開 OpenAI モデル ID ではなく、Azure ポータルで設定した **Azure デプロイメント名** でなければなりません。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイメントを作成した場合:

```text
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同じデプロイメント名ルールは、同梱の `openai` プロバイダー経由でルーティングされる画像生成呼び出しにも適用されます。

### リージョン提供状況

Azure 画像生成は現在、一部のリージョンでのみ利用可能です
（例: `eastus2`、`swedencentral`、`polandcentral`、`westus3`、
`uaenorth`）。デプロイメントを作成する前に Microsoft の最新リージョン一覧を確認し、対象モデルがそのリージョンで提供されていることを確認してください。

### パラメーターの違い

Azure OpenAI と公開 OpenAI は、常に同じ画像パラメーターを受け付けるわけではありません。Azure は、公開 OpenAI で許可されるオプション（たとえば `gpt-image-2` の一部の `background` 値）を拒否したり、特定のモデルバージョンでのみ公開したりすることがあります。これらの違いは Azure と基盤モデルに由来するものであり、OpenClaw によるものではありません。Azure リクエストがバリデーションエラーで失敗した場合は、Azure ポータルで、自分の特定のデプロイメントと API バージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAI はネイティブの transport と compat 動作を使用しますが、OpenClaw の非公開 attribution ヘッダーは受け取りません。詳細は [高度な設定](#advanced-configuration) の **Native vs OpenAI-compatible routes** アコーディオンを参照してください。

Azure 上の chat または Responses 通信（画像生成以外）には、オンボーディングフローまたは専用の Azure プロバイダー設定を使用してください。`openai.baseUrl` だけでは Azure API/認証形状は選択されません。別の `azure-openai-responses/*` プロバイダーが存在します。以下の Server-side Compaction アコーディオンを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="トランスポート（WebSocket vs SSE）">
    OpenClaw は、`openai/*` と `openai-codex/*` の両方で、SSE フォールバック付きの WebSocket 優先（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClaw は次を行います。
    - 初期の WebSocket 障害を 1 回再試行してから SSE にフォールバックする
    - 障害後、およそ 60 秒間 WebSocket を degraded としてマークし、クールダウン中は SSE を使う
    - 再試行と再接続のために安定したセッションおよびターン識別ヘッダーを付与する
    - transport の違いをまたいで使用量カウンター（`input_tokens` / `prompt_tokens`）を正規化する

    | 値 | 動作 |
    |-------|----------|
    | `"auto"`（デフォルト） | WebSocket 優先、SSE フォールバック |
    | `"sse"` | SSE のみを強制 |
    | `"websocket"` | WebSocket のみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
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

  <Accordion title="WebSocket warm-up">
    OpenClaw は、初回ターンのレイテンシを減らすため、`openai/*` と `openai-codex/*` でデフォルトで WebSocket warm-up を有効にします。

    ```json5
    // warm-up を無効化
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw は、`openai/*` と `openai-codex/*` に対して共有の fast-mode トグルを提供します。

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClaw は fast mode を OpenAI の優先処理（`service_tier = "priority"`）にマッピングします。既存の `service_tier` 値は保持され、fast mode は `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    セッション上書きは設定より優先されます。Sessions UI でセッション上書きをクリアすると、そのセッションは設定済みデフォルトに戻ります。
    </Note>

  </Accordion>

  <Accordion title="優先処理（service_tier）">
    OpenAI の API は `service_tier` による優先処理を公開しています。OpenClaw ではモデルごとに設定できます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` は、ネイティブ OpenAI エンドポイント（`api.openai.com`）とネイティブ Codex エンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。どちらかのプロバイダーをプロキシ経由でルーティングした場合、OpenClaw は `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction（Responses API）">
    直接の OpenAI Responses モデル（`api.openai.com` 上の `openai/*`）では、OpenAI Plugin の Pi-harness ストリームラッパーが server-side Compaction を自動有効化します。

    - `store: true` を強制する（モデル compat が `supportsStore: false` を設定している場合を除く）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入する
    - デフォルトの `compact_threshold`: `contextWindow` の 70%（不明な場合は `80000`）

    これは、組み込み Pi harness パスと、埋め込み実行で使われる OpenAI プロバイダーフックに適用されます。ネイティブ Codex app-server harness は Codex を通じて独自にコンテキストを管理し、`agents.defaults.embeddedHarness.runtime` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responses のような互換エンドポイントで有用です:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` は `context_management` の注入のみを制御します。直接の OpenAI Responses モデルは、compat が `supportsStore: false` を設定しない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    `openai/*` 上の GPT-5 ファミリー実行では、OpenClaw はより厳格な埋め込み実行契約を使用できます。

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClaw は次を行います。
    - ツールアクションが利用可能な場合、計画だけのターンを成功した進捗として扱わない
    - 「今すぐ実行する」よう促してターンを再試行する
    - substantial work に対して `update_plan` を自動有効化する
    - モデルが実行せずに計画し続ける場合、明示的な blocked 状態を表示する

    <Note>
    対象は OpenAI と Codex の GPT-5 ファミリー実行のみです。ほかのプロバイダーと古いモデルファミリーはデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw は、直接の OpenAI、Codex、Azure OpenAI エンドポイントを、汎用の OpenAI 互換 `/v1` プロキシとは異なる扱いにします。

    **ネイティブルート**（`openai/*`、Azure OpenAI）:
    - OpenAI の `none` effort をサポートするモデルでのみ `reasoning: { effort: "none" }` を維持する
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化された reasoning を省略する
    - ツールスキーマをデフォルトで strict mode にする
    - 検証済みのネイティブホストでのみ、非公開 attribution ヘッダーを付与する
    - OpenAI 専用のリクエスト整形（`service_tier`、`store`、reasoning 互換、プロンプトキャッシュのヒント）を維持する

    **プロキシ/互換ルート:**
    - より緩い compat 動作を使用する
    - ネイティブでない `openai-completions` ペイロードから Completions の `store` を削除する
    - OpenAI 互換 Completions プロキシ向けに、高度な `params.extra_body`/`params.extraBody` パススルー JSON を受け付ける
    - strict なツールスキーマやネイティブ専用ヘッダーを強制しない

    Azure OpenAI はネイティブの transport と compat 動作を使用しますが、非公開 attribution ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>
