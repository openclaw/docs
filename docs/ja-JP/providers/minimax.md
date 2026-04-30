---
read_when:
    - OpenClaw で MiniMax モデルを使いたい場合
    - MiniMax のセットアップガイドが必要です
summary: OpenClaw で MiniMax モデルを使用する
title: MiniMax
x-i18n:
    generated_at: "2026-04-30T05:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef833258692c78f40a160131c2a0d36f84889e5d5196ddadb648485ba8cb04a
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw の MiniMax provider は、デフォルトで **MiniMax M2.7** を使用します。

MiniMax は次も提供します。

- T2A v2 によるバンドル済み音声合成
- `MiniMax-VL-01` によるバンドル済み画像理解
- `music-2.6` によるバンドル済み音楽生成
- MiniMax Coding Plan 検索 API 経由のバンドル済み `web_search`

Provider の分割:

| Provider ID      | 認証    | 機能                                                                                                |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | APIキー | テキスト、画像生成、音楽生成、動画生成、画像理解、音声、Web 検索                                    |
| `minimax-portal` | OAuth   | テキスト、画像生成、音楽生成、動画生成、画像理解、音声                                             |

## 組み込みカタログ

| モデル                   | 種類             | 説明                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | チャット (推論)  | デフォルトのホスト型推論モデル           |
| `MiniMax-M2.7-highspeed` | チャット (推論)  | より高速な M2.7 推論ティア               |
| `MiniMax-VL-01`          | Vision           | 画像理解モデル                           |
| `image-01`               | 画像生成         | テキストから画像、画像から画像への編集   |
| `music-2.6`              | 音楽生成         | デフォルトの音楽モデル                   |
| `music-2.5`              | 音楽生成         | 以前の音楽生成ティア                     |
| `music-2.0`              | 音楽生成         | レガシーの音楽生成ティア                 |
| `MiniMax-Hailuo-2.3`     | 動画生成         | テキストから動画、画像参照フロー         |

## はじめに

希望する認証方法を選択し、セットアップ手順に従ってください。

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最適な用途:** OAuth 経由で MiniMax Coding Plan をすばやくセットアップする場合。APIキーは不要です。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            これは `api.minimax.io` に対して認証します。
          </Step>
          <Step title="モデルが利用可能か確認">
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

            これは `api.minimaxi.com` に対して認証します。
          </Step>
          <Step title="モデルが利用可能か確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth セットアップでは `minimax-portal` provider ID を使用します。モデル参照は `minimax-portal/MiniMax-M2.7` の形式に従います。
    </Note>

    <Tip>
    MiniMax Coding Plan の紹介リンク (10% オフ): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="APIキー">
    **最適な用途:** Anthropic 互換 API を使うホスト型 MiniMax。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            これは `api.minimax.io` をベース URL として設定します。
          </Step>
          <Step title="モデルが利用可能か確認">
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

            これは `api.minimaxi.com` をベース URL として設定します。
          </Step>
          <Step title="モデルが利用可能か確認">
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
    Anthropic 互換のストリーミング経路では、`thinking` を明示的に自分で設定しない限り、OpenClaw はデフォルトで MiniMax thinking を無効にします。MiniMax のストリーミングエンドポイントは、ネイティブの Anthropic thinking ブロックではなく OpenAI-style のデルタチャンクで `reasoning_content` を出力するため、暗黙的に有効なままだと内部推論が可視出力に漏れる可能性があります。
    </Warning>

    <Note>
    APIキーのセットアップでは `minimax` provider ID を使用します。モデル参照は `minimax/MiniMax-M2.7` の形式に従います。
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` で設定する

JSON を編集せずに MiniMax を設定するには、対話型設定ウィザードを使用します。

<Steps>
  <Step title="ウィザードを起動する">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="モデル/認証を選択する">
    メニューから **モデル/認証** を選択します。
  </Step>
  <Step title="MiniMax 認証オプションを選択する">
    利用可能な MiniMax オプションのいずれかを選択します。

    | 認証の選択肢 | 説明 |
    | --- | --- |
    | `minimax-global-oauth` | 国際版 OAuth（Coding Plan） |
    | `minimax-cn-oauth` | 中国版 OAuth（Coding Plan） |
    | `minimax-global-api` | 国際版 API キー |
    | `minimax-cn-api` | 中国版 API キー |

  </Step>
  <Step title="デフォルトモデルを選択する">
    プロンプトが表示されたらデフォルトモデルを選択します。
  </Step>
</Steps>

## 機能

### 画像生成

MiniMax Plugin は `image_generate` ツール用に `image-01` モデルを登録します。対応内容は次のとおりです。

- アスペクト比制御付きの**テキストから画像生成**
- アスペクト比制御付きの**画像から画像編集**（被写体参照）
- 1リクエストあたり最大 **9 枚の出力画像**
- 1編集リクエストあたり最大 **1 枚の参照画像**
- 対応アスペクト比: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

画像生成に MiniMax を使用するには、画像生成プロバイダーとして設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

この Plugin は、テキストモデルと同じ `MINIMAX_API_KEY` または OAuth 認証を使用します。MiniMax がすでに設定済みであれば、追加設定は不要です。

`minimax` と `minimax-portal` はどちらも、同じ
`image-01` モデルで `image_generate` を登録します。API キー設定では `MINIMAX_API_KEY` を使用し、OAuth 設定では代わりに同梱の `minimax-portal` 認証パスを使用できます。

画像生成は常に MiniMax 専用の画像エンドポイント
(`/v1/image_generation`) を使用し、`models.providers.minimax.baseUrl` は無視します。このフィールドはチャット/Anthropic 互換のベース URL を設定するためです。画像生成を CN エンドポイント経由にルーティングするには
`MINIMAX_API_HOST=https://api.minimaxi.com` を設定します。デフォルトのグローバルエンドポイントは
`https://api.minimax.io` です。

オンボーディングまたは API キー設定によって明示的な `models.providers.minimax`
エントリが書き込まれる場合、OpenClaw は `MiniMax-M2.7` と
`MiniMax-M2.7-highspeed` をテキスト専用チャットモデルとして具現化します。画像理解は、Plugin 所有の `MiniMax-VL-01` メディアプロバイダーを通じて別途公開されます。

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

### テキスト読み上げ

同梱の `minimax` Plugin は、MiniMax T2A v2 を
`messages.tts` 用の音声プロバイダーとして登録します。

- デフォルト TTS モデル: `speech-2.8-hd`
- デフォルト音声: `English_expressive_narrator`
- 対応する同梱モデル ID には、`speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo` が含まれます。
- 認証解決は、`messages.tts.providers.minimax.apiKey`、次に
  `minimax-portal` OAuth/トークン認証プロファイル、次に Token Plan 環境キー
  （`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`）、次に `MINIMAX_API_KEY` の順です。
- TTS ホストが設定されていない場合、OpenClaw は設定済みの
  `minimax-portal` OAuth ホストを再利用し、`/anthropic` などの Anthropic 互換パス接尾辞を取り除きます。
- 通常の音声添付は MP3 のままです。
- Feishu や Telegram などの音声メモ対象では、MiniMax
  MP3 から 48kHz Opus へ `ffmpeg` でトランスコードされます。これは、Feishu/Lark ファイル API がネイティブ音声メッセージで
  `file_type: "opus"` のみを受け付けるためです。
- MiniMax T2A は小数の `speed` と `vol` を受け付けますが、`pitch` は整数として送信されます。OpenClaw は API リクエスト前に小数の `pitch` 値を切り捨てます。

| 設定                                     | 環境変数               | デフォルト                    | 説明                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API ホスト。         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS モデル ID。                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 音声出力に使用する音声 ID。      |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 再生速度、`0.5..2.0`。           |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量、`(0, 10]`。                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数のピッチシフト、`-12..12`。  |

### 音楽生成

同梱の MiniMax Plugin は、`minimax` と `minimax-portal` の両方について、共有
`music_generate` ツールを通じて音楽生成を登録します。

- デフォルト音楽モデル: `minimax/music-2.6`
- OAuth 音楽モデル: `minimax-portal/music-2.6`
- `minimax/music-2.5` と `minimax/music-2.0` にも対応
- プロンプト制御: `lyrics`, `instrumental`, `durationSeconds`
- 出力形式: `mp3`
- セッションに支えられた実行は、`action: "status"` を含む共有タスク/ステータスフローを通じて切り離されます

MiniMax をデフォルト音楽プロバイダーとして使用するには、次のようにします。

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation) を参照してください。
</Note>

### 動画生成

同梱の MiniMax Plugin は、`minimax` と `minimax-portal` の両方について、共有
`video_generate` ツールを通じて動画生成を登録します。

- デフォルト動画モデル: `minimax/MiniMax-Hailuo-2.3`
- OAuth 動画モデル: `minimax-portal/MiniMax-Hailuo-2.3`
- モード: テキストから動画、および単一画像参照フロー
- `aspectRatio` と `resolution` に対応

MiniMax をデフォルト動画プロバイダーとして使用するには、次のようにします。

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

### 画像理解

MiniMax Plugin は、テキストカタログとは別に画像理解を登録します。

| プロバイダー ID | デフォルト画像モデル |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

そのため、バンドルされたテキストプロバイダーカタログにテキスト専用の M2.7 チャット参照がまだ表示されている場合でも、自動メディアルーティングは MiniMax の画像理解を使用できます。

### Web 検索

MiniMax Plugin は、MiniMax Coding Plan 検索 API を通じて `web_search` も登録します。

- プロバイダー ID: `minimax`
- 構造化結果: タイトル、URL、スニペット、関連クエリ
- 優先環境変数: `MINIMAX_CODE_PLAN_KEY`
- 受け入れられる環境変数エイリアス: `MINIMAX_CODING_API_KEY`
- 互換性フォールバック: すでに coding-plan トークンを指している場合の `MINIMAX_API_KEY`
- リージョン再利用: `plugins.entries.minimax.config.webSearch.region`、次に `MINIMAX_API_HOST`、次に MiniMax プロバイダーのベース URL
- 検索はプロバイダー ID `minimax` のままです。OAuth CN/global 設定は、`models.providers.minimax-portal.baseUrl` を通じて間接的にリージョンを誘導できます

設定は `plugins.entries.minimax.config.webSearch.*` 配下にあります。

<Note>
完全な Web 検索設定と使用方法については、[MiniMax 検索](/ja-JP/tools/minimax-search)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定オプション">
    | オプション | 説明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic`（Anthropic 互換）を推奨します。`https://api.minimax.io/v1` は OpenAI 互換ペイロード用の任意設定です |
    | `models.providers.minimax.api` | `anthropic-messages` を推奨します。`openai-completions` は OpenAI 互換ペイロード用の任意設定です |
    | `models.providers.minimax.apiKey` | MiniMax API キー（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` を定義します |
    | `agents.defaults.models` | allowlist に含めたいモデルのエイリアスを指定します |
    | `models.mode` | ビルトインに加えて MiniMax を追加したい場合は `merge` のままにします |
  </Accordion>

  <Accordion title="思考のデフォルト">
    `api: "anthropic-messages"` では、params/config で思考がすでに明示的に設定されていない限り、OpenClaw は `thinking: { type: "disabled" }` を注入します。

    これにより、MiniMax のストリーミングエンドポイントが OpenAI 形式のデルタチャンクで `reasoning_content` を出力し、内部推論が表示出力に漏れることを防ぎます。

  </Accordion>

  <Accordion title="高速モード">
    `/fast on` または `params.fastMode: true` は、Anthropic 互換ストリームパスで `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
  </Accordion>

  <Accordion title="フォールバック例">
    **最適な用途:** 最も強力な最新世代モデルをプライマリとして維持し、MiniMax M2.7 にフェイルオーバーします。以下の例では具体的なプライマリとして Opus を使用しています。好みの最新世代プライマリモデルに置き換えてください。

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

  <Accordion title="Coding Plan の使用状況の詳細">
    - Coding Plan 使用状況 API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（coding plan key が必要）。
    - OpenClaw は MiniMax coding-plan の使用状況を、他のプロバイダーで使われる同じ「残り %」表示に正規化します。MiniMax の生の `usage_percent` / `usagePercent` フィールドは消費済みクォータではなく残りクォータなので、OpenClaw はそれらを反転します。件数ベースのフィールドが存在する場合はそれが優先されます。
    - API が `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、必要に応じて `start_time` / `end_time` からウィンドウラベルを導出し、選択されたモデル名をプランラベルに含めるため、coding-plan ウィンドウを区別しやすくなります。
    - 使用状況スナップショットは `minimax`、`minimax-cn`、`minimax-portal` を同じ MiniMax クォータサーフェスとして扱い、Coding Plan key 環境変数へフォールバックする前に保存済みの MiniMax OAuth を優先します。

  </Accordion>
</AccordionGroup>

## メモ

- モデル参照は認証パスに従います:
  - API key 設定: `minimax/<model>`
  - OAuth 設定: `minimax-portal/<model>`
- デフォルトのチャットモデル: `MiniMax-M2.7`
- 代替チャットモデル: `MiniMax-M2.7-highspeed`
- オンボーディングと直接の API key 設定は、両方の M2.7 バリアントに対してテキスト専用のモデル定義を書き込みます
- 画像理解は Plugin 所有の `MiniMax-VL-01` メディアプロバイダーを使用します
- 正確なコスト追跡が必要な場合は、`models.json` の価格値を更新してください
- `openclaw models list` を使用して現在のプロバイダー ID を確認し、`openclaw models set minimax/MiniMax-M2.7` または `openclaw models set minimax-portal/MiniMax-M2.7` で切り替えてください

<Tip>
MiniMax Coding Plan の紹介リンク（10% オフ）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
プロバイダーのルールについては、[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    これは通常、**MiniMax プロバイダーが構成されていない**ことを意味します（一致するプロバイダーエントリがなく、MiniMax 認証プロファイル/環境キーも見つかりません）。この検出の修正は **2026.1.12** に含まれています。修正方法:

    - **2026.1.12** にアップグレード（またはソース `main` から実行）してから、Gateway を再起動します。
    - `openclaw configure` を実行して **MiniMax** 認証オプションを選択する、または
    - 一致する `models.providers.minimax` または `models.providers.minimax-portal` ブロックを手動で追加する、または
    - `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または MiniMax 認証プロファイルを設定して、一致するプロバイダーを注入できるようにします。

    モデル ID は**大文字と小文字が区別される**ことを確認してください:

    - API key パス: `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`
    - OAuth パス: `minimax-portal/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7-highspeed`

    その後、次で再確認します:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
詳細なヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting)と[FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="MiniMax Search" href="/ja-JP/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan 経由の Web 検索設定。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
