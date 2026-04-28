---
read_when:
    - OpenClaw で MiniMax models を使いたい場合
    - MiniMax のセットアップ手順が必要な場合
summary: OpenClaw で MiniMax models を使用する
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

OpenClaw の MiniMax provider は、デフォルトで **MiniMax M2.7** を使用します。

MiniMax は次も提供します。

- T2A v2 によるバンドル済み音声合成
- `MiniMax-VL-01` によるバンドル済み画像理解
- `music-2.6` によるバンドル済み音楽生成
- MiniMax Coding Plan search API を通じたバンドル済み `web_search`

provider の分割:

| Provider ID | 認証 | 機能 |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax` | API key | テキスト、画像生成、音楽生成、動画生成、画像理解、音声、Web 検索 |
| `minimax-portal` | OAuth | テキスト、画像生成、音楽生成、動画生成、画像理解、音声 |

## 組み込み catalog

| Model | 種別 | 説明 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7` | Chat（reasoning） | デフォルトのホスト型 reasoning model |
| `MiniMax-M2.7-highspeed` | Chat（reasoning） | より高速な M2.7 reasoning tier |
| `MiniMax-VL-01` | Vision | 画像理解 model |
| `image-01` | 画像生成 | テキストから画像、および画像から画像への編集 |
| `music-2.6` | 音楽生成 | デフォルトの音楽 model |
| `music-2.5` | 音楽生成 | 以前の音楽生成 tier |
| `music-2.0` | 音楽生成 | 旧式の音楽生成 tier |
| `MiniMax-Hailuo-2.3` | 動画生成 | テキストから動画、および画像参照フロー |

## はじめに

好みの認証方式を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最適な用途:** API key なしで、OAuth による MiniMax Coding Plan の素早いセットアップ。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            これにより `api.minimax.io` に対して認証します。
          </Step>
          <Step title="model が利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            これにより `api.minimaxi.com` に対して認証します。
          </Step>
          <Step title="model が利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth セットアップでは `minimax-portal` provider id を使用します。model ref は `minimax-portal/MiniMax-M2.7` の形式になります。
    </Note>

    <Tip>
    MiniMax Coding Plan の紹介リンク（10% off）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最適な用途:** Anthropic 互換 API を使うホスト型 MiniMax。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            これにより `api.minimax.io` が base URL として設定されます。
          </Step>
          <Step title="model が利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            これにより `api.minimaxi.com` が base URL として設定されます。
          </Step>
          <Step title="model が利用可能であることを確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config の例

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
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
    Anthropic 互換のストリーミングパスでは、明示的に `thinking` を設定しない限り、OpenClaw はデフォルトで MiniMax thinking を無効化します。MiniMax のストリーミング endpoint は、ネイティブ Anthropic の thinking block ではなく、OpenAI 形式の delta chunk として `reasoning_content` を出力するため、暗黙的に有効にしたままにすると内部推論が可視出力に漏れる可能性があります。
    </Warning>

    <Note>
    API-key セットアップでは `minimax` provider id を使用します。model ref は `minimax/MiniMax-M2.7` の形式になります。
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` で設定

JSON を編集せずに、対話式 config ウィザードで MiniMax を設定します:

<Steps>
  <Step title="ウィザードを起動">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth を選択">
    メニューから **Model/auth** を選びます。
  </Step>
  <Step title="MiniMax の認証オプションを選択">
    利用可能な MiniMax オプションから 1 つ選びます。

    | Auth choice | 説明 |
    | --- | --- |
    | `minimax-global-oauth` | International OAuth（Coding Plan） |
    | `minimax-cn-oauth` | China OAuth（Coding Plan） |
    | `minimax-global-api` | International API key |
    | `minimax-cn-api` | China API key |

  </Step>
  <Step title="デフォルト model を選択">
    プロンプトが表示されたらデフォルト model を選びます。
  </Step>
</Steps>

## 機能

### 画像生成

MiniMax Plugin は `image_generate` tool 用に `image-01` model を登録します。対応内容:

- **テキストから画像生成**（アスペクト比制御付き）
- **画像から画像への編集**（被写体参照）（アスペクト比制御付き）
- リクエストごとに最大 **9 枚の出力画像**
- 編集リクエストごとに最大 **1 枚の参照画像**
- 対応アスペクト比: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

画像生成に MiniMax を使うには、画像生成 provider として設定してください。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin は、テキスト model と同じ `MINIMAX_API_KEY` または OAuth 認証を使用します。MiniMax がすでにセットアップ済みなら、追加設定は不要です。

`minimax` と `minimax-portal` はどちらも同じ `image-01` model で `image_generate` を登録します。API-key セットアップでは `MINIMAX_API_KEY` を使い、OAuth セットアップではバンドル済みの `minimax-portal` auth 経路を使えます。

画像生成は常に MiniMax 専用の画像 endpoint（`/v1/image_generation`）を使用し、`models.providers.minimax.baseUrl` は無視します。これは chat/Anthropic 互換の base URL を設定するフィールドだからです。画像生成を CN endpoint 経由にしたい場合は `MINIMAX_API_HOST=https://api.minimaxi.com` を設定してください。デフォルトのグローバル endpoint は `https://api.minimax.io` です。

オンボーディングまたは API-key セットアップが明示的な `models.providers.minimax` エントリを書き込む場合、OpenClaw は `MiniMax-M2.7` と `MiniMax-M2.7-highspeed` をテキスト専用 chat model として具体化します。画像理解は、Plugin 所有の `MiniMax-VL-01` media provider を通じて別途公開されます。

<Note>
共通の tool パラメータ、provider 選択、およびフェイルオーバー挙動については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

### Text-to-speech

バンドル済みの `minimax` Plugin は、`messages.tts` 用の音声 provider として MiniMax T2A v2 を登録します。

- デフォルト TTS model: `speech-2.8-hd`
- デフォルト voice: `English_expressive_narrator`
- 対応するバンドル済み model id には `speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd`、`speech-01-turbo` が含まれます。
- 認証解決順は `messages.tts.providers.minimax.apiKey`、次に `minimax-portal` OAuth/token auth profile、次に Token Plan 環境キー（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）、最後に `MINIMAX_API_KEY` です。
- TTS host が設定されていない場合、OpenClaw は設定済みの `minimax-portal` OAuth host を再利用し、`/anthropic` のような Anthropic 互換パス接尾辞を取り除きます。
- 通常の音声添付は引き続き MP3 です。
- Feishu や Telegram のような voice-note 宛先では、MiniMax MP3 は `ffmpeg` により 48kHz Opus にトランスコードされます。これは Feishu/Lark の file API がネイティブ音声メッセージに対して `file_type: "opus"` しか受け付けないためです。
- MiniMax T2A は小数の `speed` と `vol` を受け付けますが、`pitch` は整数で送信されます。OpenClaw は API リクエスト前に小数の `pitch` 値を切り捨てます。

| Setting | Env var | Default | 説明 |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API host。 |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS model id。 |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 音声出力に使う voice id。 |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 再生速度、`0.5..2.0`。 |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量、`(0, 10]`。 |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数のピッチシフト、`-12..12`。 |

### 音楽生成

バンドル済み MiniMax Plugin は、`minimax` と `minimax-portal` の両方について、共有 `music_generate` tool を通じて音楽生成を登録します。

- デフォルト音楽 model: `minimax/music-2.6`
- OAuth 音楽 model: `minimax-portal/music-2.6`
- `minimax/music-2.5` と `minimax/music-2.0` も対応
- prompt 制御: `lyrics`, `instrumental`, `durationSeconds`
- 出力形式: `mp3`
- session に紐づく実行は、`action: "status"` を含む共有 task/status フローを通じてデタッチされます

MiniMax をデフォルト音楽 provider にするには:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
共通の tool パラメータ、provider 選択、およびフェイルオーバー挙動については [Music Generation](/ja-JP/tools/music-generation) を参照してください。
</Note>

### 動画生成

バンドル済み MiniMax Plugin は、`minimax` と `minimax-portal` の両方について、共有 `video_generate` tool を通じて動画生成を登録します。

- デフォルト動画 model: `minimax/MiniMax-Hailuo-2.3`
- OAuth 動画 model: `minimax-portal/MiniMax-Hailuo-2.3`
- モード: text-to-video および単一画像参照フロー
- `aspectRatio` と `resolution` をサポート

MiniMax をデフォルト動画 provider にするには:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
共通の tool パラメータ、provider 選択、およびフェイルオーバー挙動については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

### 画像理解

MiniMax Plugin は、画像理解をテキスト catalog とは別に登録します。

| Provider ID | デフォルト画像 model |
| ---------------- | ------------------- |
| `minimax` | `MiniMax-VL-01` |
| `minimax-portal` | `MiniMax-VL-01` |

そのため、バンドル済みテキスト provider catalog が依然としてテキスト専用の M2.7 chat ref しか表示していなくても、自動 media ルーティングでは MiniMax の画像理解を使用できます。

### Web 検索

MiniMax Plugin は、MiniMax Coding Plan search API を通じて `web_search` も登録します。

- Provider id: `minimax`
- 構造化結果: タイトル、URL、snippet、関連クエリ
- 推奨 env var: `MINIMAX_CODE_PLAN_KEY`
- 受け付ける env エイリアス: `MINIMAX_CODING_API_KEY`
- 互換フォールバック: それがすでに coding-plan token を指している場合の `MINIMAX_API_KEY`
- リージョン再利用: `plugins.entries.minimax.config.webSearch.region`、次に `MINIMAX_API_HOST`、次に MiniMax provider base URL
- 検索は引き続き provider id `minimax` 上に留まります。OAuth CN/global セットアップでも、`models.providers.minimax-portal.baseUrl` を通じて間接的にリージョンを制御できます

Config は `plugins.entries.minimax.config.webSearch.*` 配下にあります。

<Note>
完全な Web 検索設定と使用方法については [MiniMax Search](/ja-JP/tools/minimax-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定オプション">
    | Option | 説明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic` を推奨（Anthropic 互換）。`https://api.minimax.io/v1` は OpenAI 互換ペイロード用に任意 |
    | `models.providers.minimax.api` | `anthropic-messages` を推奨。`openai-completions` は OpenAI 互換ペイロード用に任意 |
    | `models.providers.minimax.apiKey` | MiniMax API key（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` を定義 |
    | `agents.defaults.models` | allowlist に入れたい alias model |
    | `models.mode` | 組み込み model に MiniMax を追加したい場合は `merge` を維持 |
  </Accordion>

  <Accordion title="Thinking のデフォルト">
    `api: "anthropic-messages"` では、thinking が params/config にすでに明示設定されていない限り、OpenClaw は `thinking: { type: "disabled" }` を注入します。

    これにより、MiniMax のストリーミング endpoint が OpenAI 形式の delta chunk として `reasoning_content` を出力し、内部推論が可視出力へ漏れるのを防ぎます。

  </Accordion>

  <Accordion title="高速モード">
    `/fast on` または `params.fastMode: true` は、Anthropic 互換ストリームパス上で `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
  </Accordion>

  <Accordion title="フォールバック例">
    **最適な用途:** 最も強力な最新世代 model を primary に保ちつつ、MiniMax M2.7 にフェイルオーバーする。以下の例では具体的な primary として Opus を使っていますが、好みの最新世代 primary model に置き換えてください。

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

  <Accordion title="Coding Plan 利用の詳細">
    - Coding Plan 利用 API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（coding plan key が必要）。
    - OpenClaw は、MiniMax coding-plan 利用量を、他 provider と同じ `% left` 表示に正規化します。MiniMax の生の `usage_percent` / `usagePercent` フィールドは消費済み quota ではなく残 quota を意味するため、OpenClaw はそれらを反転します。件数ベースのフィールドが存在する場合はそれが優先されます。
    - API が `model_remains` を返す場合、OpenClaw は chat-model エントリを優先し、必要に応じて `start_time` / `end_time` から window ラベルを導出し、さらに coding-plan window を区別しやすくするため plan ラベルに選択された model 名を含めます。
    - 利用スナップショットでは、`minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax quota サーフェスとして扱い、Coding Plan key env var にフォールバックする前に保存済みの MiniMax OAuth を優先します。

  </Accordion>
</AccordionGroup>

## 注意

- model ref は auth パスに従います:
  - API-key セットアップ: `minimax/<model>`
  - OAuth セットアップ: `minimax-portal/<model>`
- デフォルト chat model: `MiniMax-M2.7`
- 代替 chat model: `MiniMax-M2.7-highspeed`
- オンボーディングと直接 API-key セットアップは、両方の M2.7 バリアントについてテキスト専用 model 定義を書き込みます
- 画像理解は Plugin 所有の `MiniMax-VL-01` media provider を使用します
- 正確なコスト追跡が必要な場合は `models.json` の価格値を更新してください
- 現在の provider id を確認するには `openclaw models list` を使い、その後 `openclaw models set minimax/MiniMax-M2.7` または `openclaw models set minimax-portal/MiniMax-M2.7` で切り替えてください

<Tip>
MiniMax Coding Plan の紹介リンク（10% off）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
provider のルールについては [Model providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    これは通常、**MiniMax provider が設定されていない**ことを意味します（一致する provider エントリがなく、MiniMax auth profile/env key も見つからない）。この検出の修正は **2026.1.12** に含まれています。修正方法:

    - **2026.1.12** に更新する（またはソースの `main` から実行する）、その後 gateway を再起動する
    - `openclaw configure` を実行して **MiniMax** 認証オプションを選ぶ、または
    - 一致する `models.providers.minimax` または `models.providers.minimax-portal` ブロックを手動追加する、または
    - 一致する provider を注入できるように `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または MiniMax auth profile を設定する

    model id は **大文字小文字を区別**することに注意してください:

    - API-key パス: `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`
    - OAuth パス: `minimax-portal/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7-highspeed`

    その後、次で再確認してください:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
さらに支援が必要な場合: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー挙動の選び方。
  </Card>
  <Card title="Image generation" href="/ja-JP/tools/image-generation" icon="image">
    共通の画像 tool パラメータと provider 選択。
  </Card>
  <Card title="Music generation" href="/ja-JP/tools/music-generation" icon="music">
    共通の音楽 tool パラメータと provider 選択。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画 tool パラメータと provider 選択。
  </Card>
  <Card title="MiniMax Search" href="/ja-JP/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan 経由の Web 検索設定。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
