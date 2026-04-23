---
read_when:
    - agent経由で画像を生成する。
    - 画像生成providerとmodelを設定する。
    - '`image_generate` toolのパラメーターを理解する。'
summary: 設定済みprovider（OpenAI、Google Gemini、fal、MiniMax、ComfyUI、Vydra、xAI）を使って画像を生成・編集する。
title: 画像生成
x-i18n:
    generated_at: "2026-04-23T14:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fbd8eda2cb0867d1426b9349f6778c231051d600ebe451534efbee0e215c871
    source_path: tools/image-generation.md
    workflow: 15
---

# 画像生成

`image_generate` toolを使うと、agentは設定済みproviderを使って画像を作成・編集できます。生成された画像は、agentの返信内で自動的にメディア添付として配信されます。

<Note>
このtoolは、少なくとも1つの画像生成providerが利用可能な場合にのみ表示されます。agentのtoolsに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、provider API keyをセットアップしてください。
</Note>

## クイックスタート

1. 少なくとも1つのproviderのAPI keyを設定します（たとえば `OPENAI_API_KEY` または `GEMINI_API_KEY`）。
2. 必要に応じて、好みのmodelを設定します:

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

3. agentにこう依頼します: _「親しみやすいロブスターのマスコット画像を生成して。」_

Agentは自動的に `image_generate` を呼び出します。tool allow-listingは不要で、providerが利用可能ならデフォルトで有効です。

## サポートされるproviders

| Provider | デフォルトmodel | 編集対応 | API key |
| -------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI | `gpt-image-2` | はい（最大5画像） | `OPENAI_API_KEY` |
| Google | `gemini-3.1-flash-image-preview` | はい | `GEMINI_API_KEY` または `GOOGLE_API_KEY` |
| fal | `fal-ai/flux/dev` | はい | `FAL_KEY` |
| MiniMax | `image-01` | はい（subject reference） | `MINIMAX_API_KEY` またはMiniMax OAuth（`minimax-portal`） |
| ComfyUI | `workflow` | はい（1画像、workflow設定依存） | cloudでは `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| Vydra | `grok-imagine` | いいえ | `VYDRA_API_KEY` |
| xAI | `grok-imagine-image` | はい（最大5画像） | `XAI_API_KEY` |

利用可能なprovidersとmodelsを実行時に確認するには、`action: "list"` を使ってください:

```
/tool image_generate action=list
```

## Toolパラメーター

| パラメーター | 型 | 説明 |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt` | string | 画像生成prompt（`action: "generate"` で必須） |
| `action` | string | `"generate"`（デフォルト）またはproviders確認用の `"list"` |
| `model` | string | provider/model override。例: `openai/gpt-image-2` |
| `image` | string | 編集モード用の単一参照画像パスまたはURL |
| `images` | string[] | 編集モード用の複数参照画像（最大5） |
| `size` | string | サイズヒント: `1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160` |
| `aspectRatio` | string | アスペクト比: `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` |
| `resolution` | string | 解像度ヒント: `1K`、`2K`、または `4K` |
| `count` | number | 生成する画像数（1–4） |
| `filename` | string | 出力ファイル名ヒント |

すべてのproviderがすべてのパラメーターをサポートしているわけではありません。fallback providerが、厳密に要求されたものではなく近いgeometry optionをサポートしている場合、OpenClawは送信前に最も近い対応size、aspect ratio、またはresolutionへ再マップします。本当に未対応のoverrideは、引き続きtool resultで報告されます。

Tool resultは適用された設定を報告します。provider fallback中にOpenClawがgeometryを再マップした場合、返される `size`、`aspectRatio`、`resolution` の値は実際に送信されたものを反映し、`details.normalization` には要求値から適用値への変換が記録されます。

## 設定

### Model選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Provider選択順序

画像生成時、OpenClawは次の順序でprovidersを試します:

1. Tool call内の **`model` パラメーター**（agentが指定した場合）
2. config内の **`imageGenerationModel.primary`**
3. 順番どおりの **`imageGenerationModel.fallbacks`**
4. **Auto-detection** — authで利用可能なprovider defaultsのみ使用:
   - 現在のdefault providerを最初に
   - 残りの登録済み画像生成providersをprovider-id順に

Providerが失敗した場合（auth error、rate limitなど）、次の候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注記:

- Auto-detectionはauth-awareです。provider defaultが候補一覧に入るのは、
  OpenClawが実際にそのproviderで認証できる場合だけです。
- Auto-detectionはデフォルトで有効です。画像
  生成で明示的な `model`、`primary`、`fallbacks`
  エントリーだけを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。
- 現在登録されているproviders、
  そのdefault models、およびauth env-var hintsを確認するには `action: "list"` を使ってください。

### 画像編集

OpenAI、Google、fal、MiniMax、ComfyUI、xAIは参照画像の編集をサポートしています。参照画像のパスまたはURLを渡してください:

```
"この写真を水彩画風にして" + image: "/path/to/photo.jpg"
```

OpenAI、Google、xAIは、`images` パラメーター経由で最大5枚の参照画像をサポートします。fal、MiniMax、ComfyUIは1枚をサポートします。

### OpenAI `gpt-image-2`

OpenAI画像生成のデフォルトは `openai/gpt-image-2` です。古い
`openai/gpt-image-1` modelも明示的に選択できますが、新しいOpenAI
画像生成および画像編集要求には `gpt-image-2` を使うべきです。

`gpt-image-2` は、テキストからの画像生成と参照画像編集の両方を、
同じ `image_generate` tool経由でサポートします。OpenClawは `prompt`、
`count`、`size`、および参照画像をOpenAIへ渡します。OpenAIは
`aspectRatio` や `resolution` を直接受け取りません。可能であればOpenClawがそれらを
対応する `size` へマップし、そうでなければtoolがそれらを無視されたoverrideとして報告します。

4K横長画像を1枚生成:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw image generation向けのクリーンなエディトリアルポスター" size=3840x2160 count=1
```

正方形画像を2枚生成:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="落ち着いた生産性アプリのアイコンに向けた2つのビジュアル案" size=1024x1024 count=2
```

ローカル参照画像1枚を編集:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="被写体は維持し、背景を明るいスタジオセットに置き換えて" image=/path/to/reference.png size=1024x1536
```

複数参照で編集:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="1枚目の画像のキャラクター性と、2枚目の画像のカラーパレットを組み合わせて" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI画像生成を `api.openai.com` ではなくAzure OpenAI deployment経由で
ルーティングしたい場合は、OpenAI provider docs内の [Azure OpenAI endpoints](/ja-JP/providers/openai#azure-openai-endpoints)
を参照してください。

MiniMax画像生成は、同梱の両方のMiniMax authパス経由で利用可能です:

- API key構成向けの `minimax/image-01`
- OAuth構成向けの `minimax-portal/image-01`

## Provider capabilities

| Capability | OpenAI | Google | fal | MiniMax | ComfyUI | Vydra | xAI |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成 | はい（最大4） | はい（最大4） | はい（最大4） | はい（最大9） | はい（workflow定義の出力） | はい（1） | はい（最大4） |
| 編集/参照 | はい（最大5画像） | はい（最大5画像） | はい（1画像） | はい（1画像、subject ref） | はい（1画像、workflow設定依存） | いいえ | はい（最大5画像） |
| サイズ制御 | はい（最大4K） | はい | はい | いいえ | いいえ | いいえ | いいえ |
| アスペクト比 | いいえ | はい | はい（生成のみ） | はい | いいえ | いいえ | はい |
| 解像度（1K/2K/4K） | いいえ | はい | はい | いいえ | いいえ | いいえ | はい（1K/2K） |

### xAI `grok-imagine-image`

同梱xAI providerは、prompt-only要求に対して `/v1/images/generations` を使い、
`image` または `images` が存在するときは `/v1/images/edits` を使います。

- Models: `xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
- Count: 最大4
- References: 1つの `image` または最大5つの `images`
- アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
- 解像度: `1K`、`2K`
- 出力: OpenClaw管理の画像添付として返されます

OpenClawは、これらの制御が共有の
cross-provider `image_generate` 契約に存在するようになるまで、xAI固有の `quality`、`mask`、`user`、または
追加のnative-only aspect ratiosを意図的に公開しません。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのagent tools
- [fal](/ja-JP/providers/fal) — fal画像/動画providerセットアップ
- [ComfyUI](/ja-JP/providers/comfy) — ローカルComfyUIとComfy Cloud workflowセットアップ
- [Google (Gemini)](/ja-JP/providers/google) — Gemini画像providerセットアップ
- [MiniMax](/ja-JP/providers/minimax) — MiniMax画像providerセットアップ
- [OpenAI](/ja-JP/providers/openai) — OpenAI Images providerセットアップ
- [Vydra](/ja-JP/providers/vydra) — Vydraの画像、動画、音声セットアップ
- [xAI](/ja-JP/providers/xai) — Grokの画像、動画、検索、コード実行、TTSセットアップ
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — `imageGenerationModel` 設定
- [Models](/ja-JP/concepts/models) — model設定とfailover
