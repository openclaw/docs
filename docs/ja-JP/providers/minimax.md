---
read_when:
    - OpenClaw で MiniMax モデルを使用したい場合
    - MiniMax のセットアップ手順が必要です
summary: OpenClaw で MiniMax モデルを使用する
title: MiniMax
x-i18n:
    generated_at: "2026-07-11T22:37:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  バンドルされている `minimax` Plugin は、2 つのプロバイダーに加えて、チャット、画像生成、音楽生成、動画生成、画像理解、音声（T2A v2）、ウェブ検索の 7 つの機能を登録します。

  | プロバイダー ID   | 認証    | 機能                                                                                 |
  | ---------------- | ------- | ------------------------------------------------------------------------------------ |
  | `minimax`        | API キー | テキスト、画像生成、音楽生成、動画生成、画像理解、音声、ウェブ検索                         |
  | `minimax-portal` | OAuth   | テキスト、画像生成、音楽生成、動画生成、画像理解、音声                                     |

  <Tip>
  MiniMax Coding Plan の紹介リンク（10% 割引）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## 組み込みカタログ

  | モデル                    | 種類                 | 説明                                           |
  | ------------------------ | -------------------- | ---------------------------------------------- |
  | `MiniMax-M3`             | チャット（推論）       | デフォルトのホステッド推論モデル                  |
  | `MiniMax-M2.7`           | チャット（推論）       | 以前のホステッド推論モデル                        |
  | `MiniMax-M2.7-highspeed` | チャット（推論）       | より高速な M2.7 推論階層                         |
  | `MiniMax-VL-01`          | ビジョン              | 画像理解モデル                                   |
  | `image-01`               | 画像生成              | テキストからの画像生成と画像から画像への編集          |
  | `music-2.6`              | 音楽生成              | デフォルトの音楽モデル                            |
  | `MiniMax-Hailuo-2.3`     | 動画生成              | テキストから動画および画像から動画へのフロー           |

  モデル参照は認証方式に従います。API キー設定では `minimax/<model>`、OAuth 設定では `minimax-portal/<model>` を使用します。

  ## はじめに

  <Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最適な用途：** OAuth 経由で MiniMax Coding Plan をすばやく設定する場合。API キーは不要です。

    <Tabs>
      <Tab title="国際版">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            設定されるプロバイダーのベース URL：`api.minimax.io`。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国版">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            設定されるプロバイダーのベース URL：`api.minimaxi.com`。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 設定では、プロバイダー ID `minimax-portal` を使用します。モデル参照は `minimax-portal/MiniMax-M3` の形式です。
    </Note>

  </Tab>

  <Tab title="API キー">
    **最適な用途：** Anthropic 互換 API を使用するホステッド MiniMax。

    <Tabs>
      <Tab title="国際版">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            これにより、`api.minimax.io` がベース URL として設定されます。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国版">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            これにより、`api.minimaxi.com` がベース URL として設定されます。
          </Step>
          <Step title="モデルが利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 設定例

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    MiniMax-M2.x の Anthropic 互換ストリーミングエンドポイントは、ネイティブの Anthropic thinking ブロックではなく、OpenAI 形式の delta チャンクで `reasoning_content` を出力します。そのため、thinking が暗黙的に有効なままだと、内部推論が表示出力に漏れます。OpenClaw は、ユーザーが `thinking` を明示的に設定しない限り、M2.x の thinking をデフォルトで無効にします。MiniMax-M3（および前方互換の M3.x）は例外です。M3 は正しい Anthropic thinking ブロックを出力し、表示可能なコンテンツを生成するには thinking を有効にする必要があるため、OpenClaw は M3 でプロバイダーの適応型 thinking パスを維持します。以下の高度な設定にある「thinking のデフォルト」セクションを参照してください。
    </Warning>

    <Note>
    API キー設定では、プロバイダー ID `minimax` を使用します。モデル参照は `minimax/MiniMax-M3` の形式です。
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` で設定

<Steps>
  <Step title="ウィザードを起動">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="モデル/認証を選択">
    メニューから **モデル/認証** を選択します。
  </Step>
  <Step title="MiniMax の認証オプションを選択">
    | 認証方式               | 説明                                |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | 国際版 OAuth（Coding Plan）         |
    | `minimax-cn-oauth`     | 中国版 OAuth（Coding Plan）         |
    | `minimax-global-api`   | 国際版 API キー                     |
    | `minimax-cn-api`       | 中国版 API キー                     |
  </Step>
  <Step title="デフォルトモデルを選択">
    プロンプトが表示されたら、デフォルトモデルを選択します。
  </Step>
</Steps>

## 機能

### 画像生成

MiniMax Plugin は、`minimax` と `minimax-portal` の両方で `image_generate` ツール用の `image-01` モデルを登録し、テキストモデルと同じ `MINIMAX_API_KEY` または OAuth 認証を再利用します。

- アスペクト比を制御できる、テキストからの画像生成と画像から画像への編集（被写体参照）
- 1 リクエストあたり最大 9 枚の出力画像、1 編集リクエストあたり 1 枚の参照画像
- 対応アスペクト比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

画像生成では常に MiniMax 専用の画像エンドポイント（`/v1/image_generation`）を使用し、`models.providers.minimax.baseUrl` は無視されます。このフィールドはチャット用の Anthropic 互換ベース URL を設定するためのものです。画像生成を中国版エンドポイント経由で処理するには、`MINIMAX_API_HOST=https://api.minimaxi.com` を設定します。デフォルトのグローバルエンドポイントは `https://api.minimax.io` です。

<Note>
共通ツールのパラメーター、プロバイダーの選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation)を参照してください。
</Note>

### テキスト読み上げ

同梱の `minimax` Plugin は、`messages.tts` の音声プロバイダーとして MiniMax T2A v2 を登録します。

- デフォルトの TTS モデル：`speech-2.8-hd`
- デフォルトの音声：`English_expressive_narrator`
- 同梱モデル ID：`speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd`、`speech-01-turbo`、`speech-01-240228`
- 認証の解決順序：`messages.tts.providers.minimax.apiKey`、`minimax-portal` の OAuth/トークン認証プロファイル、Token Plan の環境キー（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）、`MINIMAX_API_KEY`
- TTS ホストが設定されていない場合、OpenClaw は設定済みの `minimax-portal` OAuth ホストを再利用し、`/anthropic` などの Anthropic 互換パスサフィックスを除去します
- 通常の音声添付ファイルは MP3 のままです。音声メモの送信先（Feishu、Telegram、および音声メモ互換の添付ファイルを要求するその他のチャンネル）では、MiniMax の MP3 を `ffmpeg` で 48kHz Opus にトランスコードします。たとえば、Feishu/Lark のファイル API はネイティブ音声メッセージで `file_type: "opus"` のみを受け付けるためです
- MiniMax T2A では小数の `speed` と `vol` を使用できますが、`pitch` は整数として送信されます。OpenClaw は API リクエストの前に小数の `pitch` 値を切り捨てます

| 設定                                     | 環境変数               | デフォルト                    | 説明                                      |
| ---------------------------------------- | ---------------------- | ----------------------------- | ----------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API ホスト。                   |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS モデル ID。                           |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 音声出力に使用する音声 ID。                |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 再生速度、`0.5..2.0`。                    |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量、`(0, 10]`。                         |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数のピッチシフト、`-12..12`。           |

### 音楽生成

同梱の MiniMax Plugin は、`minimax` と `minimax-portal` の両方で、共通の `music_generate` ツールを通じて音楽生成を登録します。

- デフォルトの音楽モデル：`minimax/music-2.6`（OAuth：`minimax-portal/music-2.6`）
- `music-2.6-free`、`music-cover`、`music-cover-free` にも対応
- プロンプト制御：`lyrics`、`instrumental`
- 出力形式：`mp3`
- セッションに紐づく実行は、`action: "status"` を含む共通のタスク/ステータスフローを通じて切り離されます

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
共通ツールのパラメーター、プロバイダーの選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation)を参照してください。
</Note>

### 動画生成

同梱の MiniMax Plugin は、`minimax` と `minimax-portal` の両方で、共通の `video_generate` ツールを通じて動画生成を登録します。

- デフォルトの動画モデル：`minimax/MiniMax-Hailuo-2.3`（OAuth：`minimax-portal/MiniMax-Hailuo-2.3`）
- `MiniMax-Hailuo-2.3-Fast`、`MiniMax-Hailuo-02`、`I2V-01-Director`、`I2V-01-live`、`I2V-01` にも対応
- モード：テキストから動画への生成と、単一画像を参照するフロー
- `resolution`（Hailuo 2.3/02 モデルでは `768P` または `1080P`）に対応します。`aspectRatio` には対応しておらず、指定しても無視されます

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
共通ツールのパラメーター、プロバイダーの選択、フェイルオーバーの動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

### 画像理解

MiniMax Pluginは、画像理解をテキストカタログとは別に登録します。

| プロバイダーID | デフォルト画像モデル | PDFテキスト抽出 |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

そのため、バンドルされたテキストプロバイダーカタログに画像対応のM3チャット参照も含まれている場合でも、自動メディアルーティングでMiniMaxの画像理解を使用できます。PDF理解では、テキスト抽出にのみ`MiniMax-M2.7`を使用します。MiniMaxはPDFから画像への変換経路を登録しません。

### Web検索

MiniMax Pluginは、MiniMax Token Plan検索API（`/v1/coding_plan/search`）を介して`web_search`も登録します。

- プロバイダーID: `minimax`
- 構造化された結果: タイトル、URL、スニペット、関連クエリ
- 推奨環境変数: `MINIMAX_CODE_PLAN_KEY`
- 使用可能な環境変数エイリアス: `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 互換性フォールバック: すでにToken Planの認証情報を指している場合の`MINIMAX_API_KEY`
- リージョンの再利用: `plugins.entries.minimax.config.webSearch.region`、次に`MINIMAX_API_HOST`、その次にMiniMaxプロバイダーのベースURL
- 検索ではプロバイダーID `minimax`を使用し続けます。OAuthの中国/グローバル設定では、`models.providers.minimax-portal.baseUrl`を介して間接的にリージョンを指定でき、`MINIMAX_OAUTH_TOKEN`を介してBearer認証を提供できます

設定は`plugins.entries.minimax.config.webSearch.*`に配置します。

<Note>
Web検索の完全な設定と使用方法については、[MiniMax検索](/ja-JP/tools/minimax-search)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定オプション">
    | オプション | 説明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic`（Anthropic互換）を推奨します。OpenAI互換ペイロードには、必要に応じて`https://api.minimax.io/v1`を使用できます |
    | `models.providers.minimax.api` | `anthropic-messages`を推奨します。OpenAI互換ペイロードには、必要に応じて`openai-completions`を使用できます |
    | `models.providers.minimax.apiKey` | MiniMax APIキー（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost`を定義します |
    | `agents.defaults.models` | 許可リストに追加するモデルのエイリアスを設定します |
    | `models.mode` | 組み込みモデルと併せてMiniMaxを追加する場合は、`merge`のままにします |
  </Accordion>

  <Accordion title="思考のデフォルト設定">
    `api: "anthropic-messages"`では、以前のラッパーによってペイロードの`thinking`フィールドがすでに設定されている場合を除き、OpenClawはMiniMax M2.xモデルに`thinking: { type: "disabled" }`を挿入します。これにより、M2.xのストリーミングエンドポイントがOpenAI形式の差分チャンクで`reasoning_content`を出力し、内部推論が表示出力に漏れることを防ぎます。

    MiniMax-M3（およびM3.x）は対象外です。思考を無効にすると、M3は`stop_reason: "end_turn"`と空の`content`配列を返すため、OpenClawはM3に対する暗黙的な無効化のデフォルトを削除し、思考レベルが設定されている場合は代わりに`thinking: { type: "adaptive" }`を強制します。

    モデルファミリーごとに使用可能な思考レベル:

    | モデルファミリー | レベル | デフォルト |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`、`adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`、`minimal`、`low`、`medium`、`high` | `off`      |

  </Accordion>

  <Accordion title="高速モード">
    `/fast on`または`params.fastMode: true`を指定すると、Anthropic互換のストリーム経路（`api: "anthropic-messages"`、プロバイダーは`minimax`または`minimax-portal`）で`MiniMax-M2.7`が`MiniMax-M2.7-highspeed`に書き換えられます。
  </Accordion>

  <Accordion title="フォールバックの例">
    **最適な用途:** 最も強力な最新世代モデルをプライマリとして維持し、MiniMax M2.7へフェイルオーバーします。以下の例では、具体的なプライマリとしてOpusを使用しています。希望する最新世代のプライマリモデルに置き換えてください。

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Planの使用量の詳細">
    - Coding Plan使用量API: `https://api.minimaxi.com/v1/token_plan/remains`または`https://api.minimax.io/v1/token_plan/remains`（Coding Planキーが必要です）。
    - 設定されている場合、使用量のポーリングでは`models.providers.minimax-portal.baseUrl`または`models.providers.minimax.baseUrl`からホストを導出します。そのため、`https://api.minimax.io/anthropic`を使用するグローバル設定では`api.minimax.io`をポーリングします。ベースURLがない場合や不正な場合は、互換性のために中国向けフォールバックを維持します。
    - OpenClawは、MiniMax Coding Planの使用量を、他のプロバイダーと同じ`% left`表示に正規化します。MiniMaxの生の`usage_percent` / `usagePercent`フィールドは消費済みの割り当てではなく残りの割り当てを表すため、OpenClawは値を反転します。件数ベースのフィールドが存在する場合は、そちらが優先されます。
    - APIが`model_remains`を返す場合、OpenClawはチャットモデルのエントリを優先し、必要に応じて`start_time` / `end_time`から期間ラベルを導出します。また、Coding Planの期間を区別しやすくするため、選択したモデル名をプランラベルに含めます。
    - 使用量スナップショットでは、`minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn`を同じMiniMax割り当て枠として扱い、Coding Planキーの環境変数へフォールバックする前に、保存済みのMiniMax OAuthを優先します。

  </Accordion>
</AccordionGroup>

## 注記

- デフォルトのチャットモデル: `MiniMax-M3`。代替チャットモデル: `MiniMax-M2.7`、`MiniMax-M2.7-highspeed`
- オンボーディングとAPIキーの直接設定では、M3と両方のM2.7バリアントのモデル定義を書き込みます
- 画像理解では、Pluginが所有する`MiniMax-VL-01`メディアプロバイダーを使用します
- 正確なコスト追跡が必要な場合は、`models.json`の価格値を更新してください
- `openclaw models list`を使用して現在のプロバイダーIDを確認してから、`openclaw models set minimax/MiniMax-M3`または`openclaw models set minimax-portal/MiniMax-M3`で切り替えてください

<Note>
プロバイダーのルールについては、[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title='"不明なモデル: minimax/MiniMax-M3"'>
    通常、これは**MiniMaxプロバイダーが設定されていない**ことを意味します（一致するプロバイダーエントリがなく、MiniMaxの認証プロファイルまたは環境変数キーも見つかりません）。次のいずれかの方法で修正します。

    - `openclaw configure`を実行し、**MiniMax**の認証オプションを選択する、または
    - 一致する`models.providers.minimax`または`models.providers.minimax-portal`ブロックを手動で追加する、または
    - 一致するプロバイダーを挿入できるように、`MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、またはMiniMax認証プロファイルを設定する。

    モデルIDでは**大文字と小文字が区別される**ことに注意してください。

    - APIキー経路: `minimax/MiniMax-M3`、`minimax/MiniMax-M2.7`、または`minimax/MiniMax-M2.7-highspeed`
    - OAuth経路: `minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7`、または`minimax-portal/MiniMax-M2.7-highspeed`

    次のコマンドで再確認します。

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
詳細なヘルプについては、[トラブルシューティング](/ja-JP/help/troubleshooting)と[よくある質問](/ja-JP/help/faq)を参照してください。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共通の音楽ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダーの選択。
  </Card>
  <Card title="MiniMax検索" href="/ja-JP/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Planを介したWeb検索の設定。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとよくある質問。
  </Card>
</CardGroup>
