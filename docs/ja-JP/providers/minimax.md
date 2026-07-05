---
read_when:
    - OpenClaw で MiniMax モデルを使いたい
    - MiniMax のセットアップガイダンスが必要です
summary: OpenClaw で MiniMax モデルを使用する
title: MiniMax
x-i18n:
    generated_at: "2026-07-05T11:40:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  バンドルされた `minimax` Plugin は、2 つのプロバイダーと 5 つの機能を登録します: チャット、画像生成、音楽生成、動画生成、画像理解、音声 (T2A v2)、Web 検索。

  | プロバイダー ID      | 認証    | 機能                                                                                        |
  | ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
  | `minimax`        | API キー | テキスト、画像生成、音楽生成、動画生成、画像理解、音声、Web 検索 |
  | `minimax-portal` | OAuth   | テキスト、画像生成、音楽生成、動画生成、画像理解、音声             |

  <Tip>
  MiniMax Coding Plan の紹介リンク (10% オフ): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## 組み込みカタログ

  | モデル                    | 種類             | 説明                              |
  | ------------------------ | ---------------- | ---------------------------------------- |
  | `MiniMax-M3`             | チャット (推論) | デフォルトのホスト型推論モデル           |
  | `MiniMax-M2.7`           | チャット (推論) | 以前のホスト型推論モデル          |
  | `MiniMax-M2.7-highspeed` | チャット (推論) | より高速な M2.7 推論ティア               |
  | `MiniMax-VL-01`          | ビジョン           | 画像理解モデル                |
  | `image-01`               | 画像生成 | テキストから画像、および画像から画像への編集 |
  | `music-2.6`              | 音楽生成 | デフォルトの音楽モデル                      |
  | `MiniMax-Hailuo-2.3`     | 動画生成 | テキストから動画、および画像から動画へのフロー   |

  モデル参照は認証パスに従います。API キー設定では `minimax/<model>`、OAuth 設定では `minimax-portal/<model>` です。

  ## はじめに

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **最適な用途:** OAuth 経由で MiniMax Coding Plan を使ってすばやく設定する場合。API キーは不要です。

    <Tabs>
      <Tab title="国際">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            結果のプロバイダーベース URL: `api.minimax.io`。
          </Step>
          <Step title="モデルが利用可能か確認">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            結果のプロバイダーベース URL: `api.minimaxi.com`。
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
    OAuth 設定では `minimax-portal` プロバイダー ID を使用します。モデル参照は `minimax-portal/MiniMax-M3` 形式に従います。
    </Note>

  </Tab>

  <Tab title="API キー">
    **最適な用途:** Anthropic 互換 API を備えたホスト型 MiniMax。

    <Tabs>
      <Tab title="国際">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            これにより `api.minimax.io` がベース URL として設定されます。
          </Step>
          <Step title="モデルが利用可能か確認">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国">
        <Steps>
          <Step title="オンボーディングを実行">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            これにより `api.minimaxi.com` がベース URL として設定されます。
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
    MiniMax-M2.x の Anthropic 互換ストリーミングエンドポイントは、ネイティブの Anthropic thinking ブロックではなく、OpenAI 形式のデルタチャンク内で `reasoning_content` を出力します。そのため、thinking が暗黙的に有効なままだと、内部推論が表示出力に漏れます。OpenClaw は、ユーザーが明示的に `thinking` を設定しない限り、デフォルトで M2.x の thinking を無効にします。MiniMax-M3 (および前方互換の M3.x) は例外です。M3 は適切な Anthropic thinking ブロックを出力し、表示コンテンツを生成するには thinking が有効である必要があるため、OpenClaw は M3 をプロバイダーの適応型 thinking パスのままにします。以下の詳細設定にある thinking のデフォルトセクションを参照してください。
    </Warning>

    <Note>
    API キー設定では `minimax` プロバイダー ID を使用します。モデル参照は `minimax/MiniMax-M3` 形式に従います。
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` による設定

<Steps>
  <Step title="ウィザードを起動">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="モデル/認証を選択">
    メニューから **モデル/認証** を選択します。
  </Step>
  <Step title="MiniMax 認証オプションを選択">
    | 認証の選択肢          | 説明                                |
    | ----------------------- | ----------------------------------- |
    | `minimax-global-oauth` | 国際 OAuth (Coding Plan)            |
    | `minimax-cn-oauth`     | 中国 OAuth (Coding Plan)            |
    | `minimax-global-api`   | 国際 API キー                       |
    | `minimax-cn-api`       | 中国 API キー                       |
  </Step>
  <Step title="デフォルトモデルを選ぶ">
    プロンプトが表示されたら、デフォルトモデルを選択します。
  </Step>
</Steps>

## 機能

### 画像生成

MiniMax plugin は、`minimax` と `minimax-portal` の両方で `image_generate` ツール用に `image-01` モデルを登録し、テキストモデルと同じ `MINIMAX_API_KEY` または OAuth 認証を再利用します。

- テキストから画像生成、および画像から画像への編集（被写体参照）。どちらもアスペクト比制御に対応
- 1リクエストあたり最大9枚の出力画像、編集リクエストあたり参照画像1枚
- 対応アスペクト比: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

画像生成は常に MiniMax 専用の画像エンドポイント (`/v1/image_generation`) を使用し、`models.providers.minimax.baseUrl` は無視します。このフィールドは代わりにチャット/Anthropic 互換のベース URL を設定するためです。画像生成を CN エンドポイント経由にルーティングするには、`MINIMAX_API_HOST=https://api.minimaxi.com` を設定します。デフォルトのグローバルエンドポイントは `https://api.minimax.io` です。

<Note>
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

### テキスト読み上げ

バンドルされた `minimax` plugin は、MiniMax T2A v2 を `messages.tts` 用の音声プロバイダーとして登録します。

- デフォルト TTS モデル: `speech-2.8-hd`
- デフォルト音声: `English_expressive_narrator`
- バンドル済みモデル ID: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- 認証解決順序: `messages.tts.providers.minimax.apiKey`、次に `minimax-portal` OAuth/トークン認証プロファイル、次に Token Plan 環境キー (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)、次に `MINIMAX_API_KEY`
- TTS ホストが設定されていない場合、OpenClaw は設定済みの `minimax-portal` OAuth ホストを再利用し、`/anthropic` などの Anthropic 互換パス接尾辞を取り除きます
- 通常の音声添付は MP3 のままです。ボイスノート対象（Feishu、Telegram、およびボイスノート互換添付を要求するその他のチャンネル）は、MiniMax MP3 から 48kHz Opus に `ffmpeg` でトランスコードされます。たとえば Feishu/Lark ファイル API は、ネイティブ音声メッセージに対して `file_type: "opus"` のみを受け付けるためです
- MiniMax T2A は小数の `speed` と `vol` を受け付けますが、`pitch` は整数として送信されます。OpenClaw は API リクエスト前に小数の `pitch` 値を切り捨てます

| 設定                                     | 環境変数               | デフォルト                    | 説明                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API ホスト。         |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS モデル ID。                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 音声出力に使用される音声 ID。    |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 再生速度、`0.5..2.0`。           |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量、`(0, 10]`。                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数のピッチシフト、`-12..12`。  |

### 音楽生成

バンドルされた MiniMax plugin は、`minimax` と `minimax-portal` の両方で共有 `music_generate` ツールを通じて音楽生成を登録します。

- デフォルト音楽モデル: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- `music-2.6-free`、`music-cover`、`music-cover-free` にも対応
- プロンプト制御: `lyrics`, `instrumental`
- 出力形式: `mp3`
- セッションに裏付けられた実行は、`action: "status"` を含む共有タスク/ステータスフローを通じて切り離されます

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[音楽生成](/ja-JP/tools/music-generation) を参照してください。
</Note>

### 動画生成

バンドルされた MiniMax plugin は、`minimax` と `minimax-portal` の両方で共有 `video_generate` ツールを通じて動画生成を登録します。

- デフォルト動画モデル: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- `MiniMax-Hailuo-2.3-Fast`、`MiniMax-Hailuo-02`、`I2V-01-Director`、`I2V-01-live`、`I2V-01` にも対応
- モード: テキストから動画、および単一画像参照フロー
- `resolution` (`768P` または Hailuo 2.3/02 モデルの `1080P`) に対応。`aspectRatio` は未対応で、無視されます

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
</Note>

### 画像理解

MiniMax Plugin は、テキストカタログとは別に画像理解を登録します。

| プロバイダー ID | デフォルト画像モデル | PDF テキスト抽出 |
| ---------------- | ------------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     | `MiniMax-M2.7`      |
| `minimax-portal` | `MiniMax-VL-01`     | `MiniMax-M2.7`      |

そのため、バンドルされたテキストプロバイダーカタログに M3 の画像対応チャット参照も含まれている場合でも、自動メディアルーティングは MiniMax の画像理解を使用できます。PDF 理解はテキスト抽出にのみ `MiniMax-M2.7` を使用します。MiniMax は PDF から画像への変換パスを登録しません。

### Web 検索

MiniMax Plugin は、MiniMax Token Plan 検索 API（`/v1/coding_plan/search`）経由で `web_search` も登録します。

- プロバイダー id: `minimax`
- 構造化結果: タイトル、URL、スニペット、関連クエリ
- 推奨 env var: `MINIMAX_CODE_PLAN_KEY`
- 受け入れられる env エイリアス: `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`
- 互換性フォールバック: `MINIMAX_API_KEY` がすでにトークンプラン認証情報を指している場合
- リージョン再利用: `plugins.entries.minimax.config.webSearch.region`、次に `MINIMAX_API_HOST`、次に MiniMax プロバイダーのベース URL
- 検索はプロバイダー id `minimax` のままです。OAuth の CN/global セットアップは、`models.providers.minimax-portal.baseUrl` を通じて間接的にリージョンを制御でき、`MINIMAX_OAUTH_TOKEN` を通じて bearer 認証を提供できます

設定は `plugins.entries.minimax.config.webSearch.*` 配下にあります。

<Note>
Web 検索の完全な設定と使い方については、[MiniMax Search](/ja-JP/tools/minimax-search)を参照してください。
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
    | `agents.defaults.models` | allowlist に入れたいモデルのエイリアスを設定します |
    | `models.mode` | 組み込みに加えて MiniMax を追加したい場合は `merge` のままにします |
  </Accordion>

  <Accordion title="thinking のデフォルト">
    `api: "anthropic-messages"` では、以前のラッパーがペイロード内の `thinking` フィールドをすでに設定していない限り、OpenClaw は MiniMax M2.x モデルに `thinking: { type: "disabled" }` を注入します。これにより、M2.x のストリーミングエンドポイントが OpenAI スタイルのデルタチャンクで `reasoning_content` を出力し、内部推論が可視出力へ漏れることを防ぎます。

    MiniMax-M3（および M3.x）は例外です。thinking が無効な場合、M3 は `stop_reason: "end_turn"` 付きの空の `content` 配列を返すため、OpenClaw は M3 では暗黙の disabled デフォルトを削除し、thinking レベルが設定されている場合は代わりに `thinking: { type: "adaptive" }` を強制します。

    モデルファミリーごとに利用可能な thinking レベル:

    | モデルファミリー | レベル | デフォルト |
    | -------------- | ----------------------------------------- | ---------- |
    | `MiniMax-M3`   | `off`, `adaptive`                        | `adaptive` |
    | `MiniMax-M2.x` | `off`, `minimal`, `low`, `medium`, `high` | `off`      |

  </Accordion>

  <Accordion title="高速モード">
    `/fast on` または `params.fastMode: true` は、Anthropic 互換ストリームパス（`api: "anthropic-messages"`、プロバイダー `minimax` または `minimax-portal`）で `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
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

  <Accordion title="Coding Plan の使用詳細">
    - Coding Plan 使用量 API: `https://api.minimaxi.com/v1/token_plan/remains` または `https://api.minimax.io/v1/token_plan/remains`（coding plan キーが必要です）。
    - 使用量ポーリングは、設定されている場合は `models.providers.minimax-portal.baseUrl` または `models.providers.minimax.baseUrl` からホストを導出するため、`https://api.minimax.io/anthropic` を使用する global セットアップでは `api.minimax.io` をポーリングします。ベース URL がない、または不正な形式の場合は、互換性のため CN フォールバックを維持します。
    - OpenClaw は MiniMax の coding-plan 使用量を、他のプロバイダーで使用される同じ `% left` 表示に正規化します。MiniMax の生の `usage_percent` / `usagePercent` フィールドは消費済みクォータではなく残りクォータなので、OpenClaw はそれらを反転します。件数ベースのフィールドが存在する場合はそれが優先されます。
    - API が `model_remains` を返す場合、OpenClaw はチャットモデルエントリを優先し、必要に応じて `start_time` / `end_time` からウィンドウラベルを導出し、選択されたモデル名をプランラベルに含めるため、coding-plan ウィンドウを区別しやすくなります。
    - 使用量スナップショットは、`minimax`、`minimax-cn`、`minimax-portal`、`minimax-portal-cn` を同じ MiniMax クォータサーフェスとして扱い、Coding Plan キーの env var にフォールバックする前に保存済みの MiniMax OAuth を優先します。

  </Accordion>
</AccordionGroup>

## メモ

- デフォルトチャットモデル: `MiniMax-M3`。代替チャットモデル: `MiniMax-M2.7`、`MiniMax-M2.7-highspeed`
- オンボーディングと直接 API キーセットアップは、M3 と両方の M2.7 バリアントのモデル定義を書き込みます
- 画像理解は、Plugin 所有の `MiniMax-VL-01` メディアプロバイダーを使用します
- 正確なコスト追跡が必要な場合は、`models.json` の価格値を更新してください
- 現在のプロバイダー id を確認するには `openclaw models list` を使用し、その後 `openclaw models set minimax/MiniMax-M3` または `openclaw models set minimax-portal/MiniMax-M3` で切り替えます

<Note>
プロバイダールールについては、[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    これは通常、**MiniMax プロバイダーが設定されていない**（一致するプロバイダーエントリがなく、MiniMax 認証プロファイル/env キーも見つからない）ことを意味します。修正方法:

    - `openclaw configure` を実行して **MiniMax** 認証オプションを選択する、または
    - 一致する `models.providers.minimax` または `models.providers.minimax-portal` ブロックを手動で追加する、または
    - `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または MiniMax 認証プロファイルを設定して、一致するプロバイダーを注入できるようにする。

    モデル id は**大文字と小文字が区別される**ことを確認してください:

    - API キーパス: `minimax/MiniMax-M3`、`minimax/MiniMax-M2.7`、または `minimax/MiniMax-M2.7-highspeed`
    - OAuth パス: `minimax-portal/MiniMax-M3`、`minimax-portal/MiniMax-M2.7`、または `minimax-portal/MiniMax-M2.7-highspeed`

    その後、次で再確認します:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
その他のヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting)および [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="MiniMax Search" href="/ja-JP/tools/minimax-search" icon="magnifying-glass">
    MiniMax Token Plan による Web 検索設定。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングと FAQ。
  </Card>
</CardGroup>
