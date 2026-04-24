---
read_when:
    - エージェント経由で画像を生成している場合
    - 画像生成プロバイダーとモデルを設定している場合
    - '`image_generate`ツールのパラメーターを理解している場合'
summary: 設定済みプロバイダー（OpenAI、OpenAI Codex OAuth、Google Gemini、OpenRouter、fal、MiniMax、ComfyUI、Vydra、xAI）を使って画像を生成・編集する
title: 画像生成
x-i18n:
    generated_at: "2026-04-24T05:25:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate`ツールを使うと、設定済みプロバイダーを使ってエージェントが画像を生成・編集できます。生成された画像は、エージェントの返信内でメディア添付として自動的に配信されます。

<Note>
このツールは、少なくとも1つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに`image_generate`が表示されない場合は、`agents.defaults.imageGenerationModel`を設定し、プロバイダーAPI keyをセットアップするか、OpenAI Codex OAuthでサインインしてください。
</Note>

## クイックスタート

1. 少なくとも1つのプロバイダーにAPI keyを設定します（例: `OPENAI_API_KEY`、`GEMINI_API_KEY`、または`OPENROUTER_API_KEY`）。あるいはOpenAI Codex OAuthでサインインします。
2. 必要に応じて、使用したいモデルを設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuthでも同じ`openai/gpt-image-2`モデル参照を使います。`openai-codex` OAuthプロファイルが設定されている場合、OpenClawは画像リクエストを最初に`OPENAI_API_KEY`で試すのではなく、その同じOAuthプロファイル経由でルーティングします。API keyやcustom/Azure base URLなど、明示的なカスタム`models.providers.openai`画像設定を行うと、直接のOpenAI Images APIルートへ戻ります。LocalAIのようなOpenAI互換LAN endpointでは、カスタム`models.providers.openai.baseUrl`を維持したうえで、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`を明示的に有効化してください。private/internal画像endpointはデフォルトでは引き続きブロックされます。

3. エージェントに次のように依頼します: _「親しみやすいロボットのマスコット画像を生成して」_

エージェントは自動的に`image_generate`を呼び出します。ツールのallow-list指定は不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。

## サポートされるプロバイダー

| プロバイダー | デフォルトモデル | 編集サポート | 認証 |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | はい（最大4画像）               | `OPENAI_API_KEY`またはOpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | はい（最大5枚の入力画像）         | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | はい                                | `GEMINI_API_KEY`または`GOOGLE_API_KEY`                  |
| fal        | `fal-ai/flux/dev`                       | はい                                | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | はい（subject reference）            | `MINIMAX_API_KEY`またはMiniMax OAuth（`minimax-portal`） |
| ComfyUI    | `workflow`                              | はい（1画像、workflow設定依存） | cloudでは`COMFY_API_KEY`または`COMFY_CLOUD_API_KEY`    |
| Vydra      | `grok-imagine`                          | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | はい（最大5画像）               | `XAI_API_KEY`                                         |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"`を使ってください。

```
/tool image_generate action=list
```

## ツールパラメーター

<ParamField path="prompt" type="string" required>
画像生成プロンプト。`action: "generate"`で必須です。
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
実行時に利用可能なプロバイダーとモデルを確認するには`"list"`を使います。
</ParamField>

<ParamField path="model" type="string">
プロバイダー/モデルの上書き。例: `openai/gpt-image-2`。
</ParamField>

<ParamField path="image" type="string">
編集モード用の単一参照画像パスまたはURL。
</ParamField>

<ParamField path="images" type="string[]">
編集モード用の複数参照画像（最大5枚）。
</ParamField>

<ParamField path="size" type="string">
サイズヒント: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`。
</ParamField>

<ParamField path="aspectRatio" type="string">
アスペクト比: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`。
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
解像度ヒント。
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
プロバイダーが対応している場合の品質ヒント。
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
プロバイダーが対応している場合の出力形式ヒント。
</ParamField>

<ParamField path="count" type="number">
生成する画像数（1〜4）。
</ParamField>

<ParamField path="timeoutMs" type="number">
任意のプロバイダーリクエストタイムアウト（ミリ秒）。
</ParamField>

<ParamField path="filename" type="string">
出力ファイル名ヒント。
</ParamField>

<ParamField path="openai" type="object">
OpenAI専用ヒント: `background`、`moderation`、`outputCompression`、`user`。
</ParamField>

すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。フォールバック先プロバイダーが、要求された正確なジオメトリではなく近いジオメトリオプションに対応している場合、OpenClawは送信前に最も近い対応済みサイズ、アスペクト比、または解像度へ再マッピングします。`quality`や`outputFormat`のような未対応の出力ヒントは、対応宣言のないプロバイダーでは除外され、その旨がツール結果に報告されます。

ツール結果には適用された設定が報告されます。プロバイダーフォールバック中にOpenClawがジオメトリを再マッピングした場合、返される`size`、`aspectRatio`、`resolution`の値は実際に送信された内容を反映し、`details.normalization`には要求値から適用値への変換が記録されます。

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### プロバイダー選択順序

画像生成時、OpenClawは次の順序でプロバイダーを試します。

1. ツール呼び出しの**`model`パラメーター**（エージェントが指定した場合）
2. 設定の**`imageGenerationModel.primary`**
3. 順番どおりの**`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証で裏付けられたプロバイダーデフォルトのみを使用:
   - 現在のデフォルトプロバイダーを最初に
   - 残りの登録済み画像生成プロバイダーをprovider-id順に

プロバイダーが失敗した場合（認証エラー、レート制限など）、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注意:

- 自動検出は認証を考慮します。OpenClawがそのプロバイダーで実際に認証できる場合にのみ、プロバイダーデフォルトが候補リストへ入ります。
- 自動検出はデフォルトで有効です。画像生成で明示的な`model`、`primary`、`fallbacks`
  エントリのみを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false`を設定してください。
- 現在登録されているプロバイダー、その
  デフォルトモデル、およびauth env-varヒントを確認するには、`action: "list"`を使ってください。

### 画像編集

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI、xAIは参照画像編集をサポートしています。参照画像のパスまたはURLを渡してください。

```
"この写真を水彩画風にして" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAIは、`images`パラメーター経由で最大5枚の参照画像をサポートします。fal、MiniMax、ComfyUIは1枚をサポートします。

### OpenRouter画像モデル

OpenRouter画像生成は同じ`OPENROUTER_API_KEY`を使い、OpenRouterのchat completions image API経由でルーティングされます。OpenRouter画像モデルは`openrouter/`プレフィックス付きで選択してください。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClawは`prompt`、`count`、参照画像、およびGemini互換の`aspectRatio` / `resolution`ヒントをOpenRouterへ転送します。現在の組み込みOpenRouter画像モデルショートカットには`google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2`が含まれます。設定済みPluginが何を公開しているかは`action: "list"`で確認してください。

### OpenAI `gpt-image-2`

OpenAI画像生成のデフォルトは`openai/gpt-image-2`です。`openai-codex` OAuthプロファイルが設定されている場合、OpenClawはCodex subscription chat modelで使うのと同じOAuthプロファイルを再利用し、Codex Responsesバックエンド経由で画像リクエストを送信します。そのリクエストで`OPENAI_API_KEY`へ暗黙にフォールバックすることはありません。直接のOpenAI Images APIルーティングを強制するには、API key、custom base URL、またはAzure endpointを使って`models.providers.openai`を明示的に設定してください。旧来の`openai/gpt-image-1`モデルも引き続き明示的に選択できますが、新しいOpenAI画像生成および画像編集リクエストでは`gpt-image-2`を使うべきです。

`gpt-image-2`は、同じ`image_generate`ツールを通じてtext-to-image生成と参照画像編集の両方をサポートします。OpenClawは`prompt`、`count`、`size`、`quality`、`outputFormat`、および参照画像をOpenAIへ転送します。OpenAIは`aspectRatio`や`resolution`を直接は受け取りません。可能な場合、OpenClawがそれらを対応する`size`へマッピングし、そうでなければツールが無視された上書きとして報告します。

OpenAI固有オプションは`openai`オブジェクト配下にあります。

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background`は`transparent`、`opaque`、または`auto`を受け付けます。transparent出力には`outputFormat`として`png`または`webp`が必要です。`openai.outputCompression`はJPEG/WebP出力に適用されます。

4Kの横長画像を1枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw image generation向けのクリーンなエディトリアルポスター" size=3840x2160 count=1
```

正方形画像を2枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="落ち着いた生産性アプリアイコンのための2つのビジュアル方向性" size=1024x1024 count=2
```

ローカル参照画像を1枚編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="被写体は維持し、背景を明るいスタジオセットに置き換えて" image=/path/to/reference.png size=1024x1536
```

複数参照で編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="1枚目の画像のキャラクター性と2枚目のカラーパレットを組み合わせて" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI画像生成を`api.openai.com`ではなくAzure OpenAI deployment経由でルーティングするには、OpenAIプロバイダードキュメント内の[Azure OpenAI endpoints](/ja-JP/providers/openai#azure-openai-endpoints)を参照してください。

MiniMax画像生成は、バンドルされたMiniMax認証パスの両方で利用できます。

- API-keyセットアップ向けの`minimax/image-01`
- OAuthセットアップ向けの`minimax-portal/image-01`

## プロバイダー機能

| 機能 | OpenAI | Google | fal | MiniMax | ComfyUI | Vydra | xAI |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成 | はい（最大4件）        | はい（最大4件）        | はい（最大4件）       | はい（最大9件）              | はい（workflow定義の出力）     | はい（1件） | はい（最大4件）        |
| 編集/参照        | はい（最大5画像） | はい（最大5画像） | はい（1画像）       | はい（1画像、subject ref） | はい（1画像、workflow設定依存） | いいえ      | はい（最大5画像） |
| サイズ制御          | はい（最大4K）       | はい                  | はい                 | いいえ                         | いいえ                                 | いいえ      | いいえ                   |
| アスペクト比          | いいえ                   | はい                  | はい（生成のみ） | はい                        | いいえ                                 | いいえ      | はい                  |
| 解像度（1K/2K/4K） | いいえ                   | はい                  | はい                 | いいえ                         | いいえ                                 | いいえ      | はい（1K/2K）          |

### xAI `grok-imagine-image`

バンドルされたxAIプロバイダーは、promptのみのリクエストでは`/v1/images/generations`を使い、
`image`または`images`がある場合は`/v1/images/edits`を使います。

- モデル: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- 数: 最大4
- 参照: 1つの`image`または最大5つの`images`
- アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- 解像度: `1K`, `2K`
- 出力: OpenClaw管理の画像添付として返されます

OpenClawは、xAIネイティブの`quality`、`mask`、`user`、および追加のネイティブ専用アスペクト比を、共有クロスプロバイダー`image_generate`コントラクトにそれらの制御が存在するまで、意図的に公開していません。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [fal](/ja-JP/providers/fal) — fal画像/動画プロバイダー設定
- [ComfyUI](/ja-JP/providers/comfy) — ローカルComfyUIおよびComfy Cloud workflow設定
- [Google (Gemini)](/ja-JP/providers/google) — Gemini画像プロバイダー設定
- [MiniMax](/ja-JP/providers/minimax) — MiniMax画像プロバイダー設定
- [OpenAI](/ja-JP/providers/openai) — OpenAI Imagesプロバイダー設定
- [Vydra](/ja-JP/providers/vydra) — Vydra画像、動画、音声設定
- [xAI](/ja-JP/providers/xai) — Grok画像、動画、検索、コード実行、およびTTS設定
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — `imageGenerationModel`設定
- [Models](/ja-JP/concepts/models) — モデル設定とフェイルオーバー
