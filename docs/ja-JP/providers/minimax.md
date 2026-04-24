---
read_when:
    - OpenClawでMiniMaxモデルを使いたい
    - MiniMaxのセットアップガイダンスが必要です
summary: OpenClawでMiniMaxモデルを使う
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T05:15:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

OpenClawのMiniMaxプロバイダは、デフォルトで **MiniMax M2.7** を使います。

MiniMaxは次も提供します:

- T2A v2によるバンドル済み音声合成
- `MiniMax-VL-01` によるバンドル済み画像理解
- `music-2.5+` によるバンドル済み音楽生成
- MiniMax Coding Plan search API経由のバンドル済み `web_search`

プロバイダの分割:

| プロバイダID | 認証 | Capability |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax` | API key | テキスト、画像生成、画像理解、音声、web search |
| `minimax-portal` | OAuth | テキスト、画像生成、画像理解 |

## 組み込みcatalog

| モデル | 種類 | 説明 |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7` | Chat（reasoning） | デフォルトのホスト型reasoningモデル |
| `MiniMax-M2.7-highspeed` | Chat（reasoning） | より高速なM2.7 reasoning tier |
| `MiniMax-VL-01` | Vision | 画像理解モデル |
| `image-01` | 画像生成 | text-to-image と image-to-image 編集 |
| `music-2.5+` | 音楽生成 | デフォルトの音楽モデル |
| `music-2.5` | 音楽生成 | 以前の音楽生成tier |
| `music-2.0` | 音楽生成 | 従来の音楽生成tier |
| `MiniMax-Hailuo-2.3` | 動画生成 | text-to-video と画像参照フロー |

## はじめに

好みの認証方法を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最適な用途:** MiniMax Coding PlanをOAuthで手早くセットアップしたい場合。API key不要。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行する">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            これは `api.minimax.io` に対して認証します。
          </Step>
          <Step title="モデルが利用可能か確認する">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="オンボーディングを実行する">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            これは `api.minimaxi.com` に対して認証します。
          </Step>
          <Step title="モデルが利用可能か確認する">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth構成では `minimax-portal` provider idを使います。モデルrefは `minimax-portal/MiniMax-M2.7` の形式に従います。
    </Note>

    <Tip>
    MiniMax Coding Planの紹介リンク（10% off）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **最適な用途:** Anthropic互換APIを使うホスト型MiniMax。

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="オンボーディングを実行する">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            これにより、base URLとして `api.minimax.io` が設定されます。
          </Step>
          <Step title="モデルが利用可能か確認する">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="オンボーディングを実行する">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            これにより、base URLとして `api.minimaxi.com` が設定されます。
          </Step>
          <Step title="モデルが利用可能か確認する">
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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    Anthropic互換ストリーミング経路では、明示的に `thinking` を設定しない限り、OpenClawはデフォルトでMiniMax thinkingを無効にします。MiniMaxのストリーミングendpointは、ネイティブAnthropic thinking blockではなく、OpenAIスタイルのdelta chunkで `reasoning_content` を出力するため、暗黙的に有効なままだと内部reasoningが可視出力へ漏れる可能性があります。
    </Warning>

    <Note>
    API-key構成では `minimax` provider idを使います。モデルrefは `minimax/MiniMax-M2.7` の形式に従います。
    </Note>

  </Tab>
</Tabs>

## `openclaw configure` 経由で設定する

JSONを編集せずにMiniMaxを設定するには、対話型config wizardを使います:

<Steps>
  <Step title="wizardを起動する">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Model/auth を選ぶ">
    メニューから **Model/auth** を選びます。
  </Step>
  <Step title="MiniMax認証オプションを選ぶ">
    利用可能なMiniMaxオプションのいずれかを選びます:

    | 認証選択 | 説明 |
    | --- | --- |
    | `minimax-global-oauth` | International OAuth（Coding Plan） |
    | `minimax-cn-oauth` | China OAuth（Coding Plan） |
    | `minimax-global-api` | International API key |
    | `minimax-cn-api` | China API key |

  </Step>
  <Step title="デフォルトモデルを選ぶ">
    プロンプトが表示されたら、デフォルトモデルを選択します。
  </Step>
</Steps>

## Capability

### 画像生成

MiniMax Pluginは、`image_generate` ツール用に `image-01` モデルを登録します。対応内容:

- **Text-to-image生成**（アスペクト比制御付き）
- **Image-to-image編集**（subject reference）（アスペクト比制御付き）
- リクエストごとに最大 **9枚の出力画像**
- 編集リクエストごとに最大 **1枚の参照画像**
- 対応アスペクト比: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

画像生成にMiniMaxを使うには、画像生成プロバイダとして設定します:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Pluginは、テキストモデルと同じ `MINIMAX_API_KEY` またはOAuth認証を使います。MiniMaxがすでに設定済みであれば、追加設定は不要です。

`minimax` と `minimax-portal` の両方が、同じ
`image-01` モデルで `image_generate` を登録します。API-key構成では `MINIMAX_API_KEY` を使います。OAuth構成では、代わりにバンドル済みの
`minimax-portal` 認証経路を使えます。

オンボーディングまたはAPI-keyセットアップが明示的な `models.providers.minimax`
エントリを書き込むと、OpenClawは `MiniMax-M2.7` と
`MiniMax-M2.7-highspeed` を `input: ["text", "image"]` 付きでmaterializeします。

組み込みのバンドル済みMiniMaxテキストcatalog自体は、その明示的なprovider設定が存在するまでは、テキスト専用メタデータのままです。画像理解は、Plugin所有の `MiniMax-VL-01` メディアプロバイダを通じて別個に公開されます。

<Note>
共有ツールパラメータ、プロバイダ選択、フェイルオーバー動作については [画像生成](/ja-JP/tools/image-generation) を参照してください。
</Note>

### 音楽生成

バンドル済み `minimax` Pluginは、共有
`music_generate` ツール経由で音楽生成も登録します。

- デフォルト音楽モデル: `minimax/music-2.5+`
- `minimax/music-2.5` と `minimax/music-2.0` もサポート
- プロンプト制御: `lyrics`、`instrumental`、`durationSeconds`
- 出力形式: `mp3`
- セッションバックエンド実行は、`action: "status"` を含む共有task/statusフローを通じて切り離される

MiniMaxをデフォルト音楽プロバイダとして使うには:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
共有ツールパラメータ、プロバイダ選択、フェイルオーバー動作については [音楽生成](/ja-JP/tools/music-generation) を参照してください。
</Note>

### 動画生成

バンドル済み `minimax` Pluginは、共有
`video_generate` ツール経由で動画生成も登録します。

- デフォルト動画モデル: `minimax/MiniMax-Hailuo-2.3`
- モード: text-to-video と単一画像参照フロー
- `aspectRatio` と `resolution` をサポート

MiniMaxをデフォルト動画プロバイダとして使うには:

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
共有ツールパラメータ、プロバイダ選択、フェイルオーバー動作については [動画生成](/ja-JP/tools/video-generation) を参照してください。
</Note>

### 画像理解

MiniMax Pluginは、画像理解をテキスト
catalogとは別に登録します:

| プロバイダID | デフォルト画像モデル |
| ---------------- | ------------------- |
| `minimax` | `MiniMax-VL-01` |
| `minimax-portal` | `MiniMax-VL-01` |

そのため、バンドル済みテキストプロバイダcatalogが依然としてテキスト専用のM2.7 chat refしか表示していない場合でも、自動メディアルーティングではMiniMax画像理解を使えます。

### Web search

MiniMax Pluginは、MiniMax Coding Plan
search API経由で `web_search` も登録します。

- プロバイダid: `minimax`
- 構造化結果: タイトル、URL、スニペット、関連クエリ
- 推奨env var: `MINIMAX_CODE_PLAN_KEY`
- 受け付けるenv alias: `MINIMAX_CODING_API_KEY`
- 互換フォールバック: すでにcoding-plan tokenを指している場合の `MINIMAX_API_KEY`
- region再利用: `plugins.entries.minimax.config.webSearch.region`、次に `MINIMAX_API_HOST`、次にMiniMaxプロバイダbase URL
- searchはprovider id `minimax` のまま維持される。OAuth CN/global構成でも `models.providers.minimax-portal.baseUrl` を通じて間接的にregionを誘導できる

設定は `plugins.entries.minimax.config.webSearch.*` の下にあります。

<Note>
完全なweb search設定と使用方法については [MiniMax Search](/ja-JP/tools/minimax-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="設定オプション">
    | オプション | 説明 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | `https://api.minimax.io/anthropic`（Anthropic互換）を推奨。`https://api.minimax.io/v1` もOpenAI互換ペイロード用として任意で使用可能 |
    | `models.providers.minimax.api` | `anthropic-messages` を推奨。`openai-completions` もOpenAI互換ペイロード用として任意で使用可能 |
    | `models.providers.minimax.apiKey` | MiniMax API key（`MINIMAX_API_KEY`） |
    | `models.providers.minimax.models` | `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` を定義 |
    | `agents.defaults.models` | allowlistに入れたいモデルへaliasを付ける |
    | `models.mode` | 組み込みモデルと並べてMiniMaxを追加したい場合は `merge` のままにする |
  </Accordion>

  <Accordion title="thinkingデフォルト">
    `api: "anthropic-messages"` では、thinkingがparams/configですでに明示設定されていない限り、OpenClawは `thinking: { type: "disabled" }` を注入します。

    これにより、MiniMaxのストリーミングendpointがOpenAIスタイルのdelta chunkで `reasoning_content` を出力し、内部reasoningが可視出力へ漏れるのを防ぎます。

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` または `params.fastMode: true` は、Anthropic互換ストリーム経路で `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
  </Accordion>

  <Accordion title="フォールバック例">
    **最適な用途:** 最新世代の最強モデルをprimaryに保ちつつ、MiniMax M2.7へフェイルオーバーする。以下の例では具体的なprimaryとしてOpusを使っています。好みの最新世代primaryモデルに置き換えてください。

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

  <Accordion title="Coding Plan使用量の詳細">
    - Coding Plan使用量API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（coding plan keyが必要）。
    - OpenClawは、MiniMax coding-plan使用量を、他のプロバイダで使われるのと同じ `% left` 表示に正規化します。MiniMaxの生の `usage_percent` / `usagePercent` フィールドは消費済みquotaではなく残りquotaなので、OpenClawはそれを反転します。件数ベースのフィールドが存在する場合はそちらが優先されます。
    - APIが `model_remains` を返す場合、OpenClawはchat-modelエントリを優先し、必要に応じて `start_time` / `end_time` からwindow labelを導出し、さらに選択されたモデル名をplan labelに含めることで、coding-plan windowを区別しやすくします。
    - 使用量スナップショットは `minimax`、`minimax-cn`、`minimax-portal` を同一のMiniMax quotaサーフェスとして扱い、Coding Plan key env varへフォールバックする前に、保存済みMiniMax OAuthを優先します。
  </Accordion>
</AccordionGroup>

## 注記

- モデルrefは認証経路に従います:
  - API-key設定: `minimax/<model>`
  - OAuth設定: `minimax-portal/<model>`
- デフォルトchatモデル: `MiniMax-M2.7`
- 代替chatモデル: `MiniMax-M2.7-highspeed`
- オンボーディングと直接API-key設定では、両方のM2.7 variantに対して `input: ["text", "image"]` 付きの明示的モデル定義を書き込みます
- バンドル済みprovider catalogは現在、明示的なMiniMax provider configが存在するまではchat refをテキスト専用メタデータとして公開します
- 正確なコスト追跡が必要なら、`models.json` 内の価格値を更新してください
- 現在のprovider idを確認するには `openclaw models list` を使い、その後 `openclaw models set minimax/MiniMax-M2.7` または `openclaw models set minimax-portal/MiniMax-M2.7` で切り替えてください

<Tip>
MiniMax Coding Planの紹介リンク（10% off）: [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
プロバイダルールについては [モデルプロバイダ](/ja-JP/concepts/model-providers) を参照してください。
</Note>

## トラブルシューティング

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    これは通常、**MiniMaxプロバイダが設定されていない** ことを意味します（一致するprovider entryがなく、MiniMax auth profile/env keyも見つからない）。この検出に対する修正は **2026.1.12** に入っています。次のいずれかで修正してください:

    - **2026.1.12** にアップグレードする（またはソースの `main` から実行する）その後gatewayを再起動する。
    - `openclaw configure` を実行して **MiniMax** 認証オプションを選ぶ、または
    - 一致する `models.providers.minimax` または `models.providers.minimax-portal` ブロックを手動で追加する、または
    - 一致するproviderが注入できるよう、`MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN`、またはMiniMax auth profileを設定する。

    モデルidは **大文字小文字を区別する** ことを確認してください:

    - API-key経路: `minimax/MiniMax-M2.7` または `minimax/MiniMax-M2.7-highspeed`
    - OAuth経路: `minimax-portal/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7-highspeed`

    その後、次で再確認してください:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
詳細は [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq) を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダ、モデルref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="音楽生成" href="/ja-JP/tools/music-generation" icon="music">
    共有音楽ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメータとプロバイダ選択。
  </Card>
  <Card title="MiniMax Search" href="/ja-JP/tools/minimax-search" icon="magnifying-glass">
    MiniMax Coding Plan経由のweb search設定。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的なトラブルシューティングとFAQ。
  </Card>
</CardGroup>
