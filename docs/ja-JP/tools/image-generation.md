---
read_when:
    - エージェントによる画像の生成または編集
    - 画像生成プロバイダーとモデルの設定
    - image_generate ツールのパラメーターを理解する
sidebarTitle: Image generation
summary: OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 全体で image_generate 経由で画像を生成および編集する
title: 画像生成
x-i18n:
    generated_at: "2026-07-05T11:50:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ec9aff49f988503a5205abf538fc30a99460eb0b77d7bddd6dde74f2845a6d0
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` ツールは、設定済みのプロバイダーを通じて画像を作成および編集します。チャットセッションでは非同期で実行されます。OpenClaw はバックグラウンドタスクを記録し、タスク id を即座に返し、プロバイダーが完了するとエージェントを起床します。完了エージェントは、セッションの通常の可視返信モードに従います。設定されている場合は自動で最終返信を配信し、セッションでメッセージツールが必要な場合は `message(action="send")` を使います。要求元セッションが非アクティブであるか、そのアクティブ起床に失敗した場合、OpenClaw は生成された画像を含む冪等な直接フォールバックを送信し、結果が失われないようにします。

<Note>
このツールは、少なくとも 1 つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、プロバイダーの API キーを設定するか、OpenAI ChatGPT/Codex OAuth でサインインしてください。
</Note>

## クイックスタート

<Steps>
  <Step title="認証を設定する">
    少なくとも 1 つのプロバイダーに API キーを設定するか（例: `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）、OpenAI Codex OAuth でサインインします。
  </Step>
  <Step title="デフォルトモデルを選択する（任意）">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    ChatGPT/Codex OAuth は同じ `openai/gpt-image-2` モデル参照を使用します。`openai` OAuth プロファイルが設定されている場合、OpenClaw は最初に `OPENAI_API_KEY` を試す代わりに、その OAuth プロファイル経由で画像リクエストをルーティングします。明示的な `models.providers.openai` 設定（API キー、カスタム/Azure ベース URL）を指定すると、直接の OpenAI Images API ルートに戻ります。

  </Step>
  <Step title="エージェントに依頼する">
    _「親しみやすいロボットマスコットの画像を生成して。」_

    エージェントは `image_generate` を自動的に呼び出します。ツールの許可リスト登録は不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。ツールはバックグラウンドタスク id を返し、その後、準備ができると完了エージェントが `message` ツールを通じて生成された添付ファイルを送信します。

  </Step>
</Steps>

<Warning>
LocalAI などの OpenAI 互換 LAN エンドポイントでは、カスタムの `models.providers.openai.baseUrl` を保持し、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` で明示的にオプトインしてください。プライベートおよび内部の画像エンドポイントは、デフォルトでは引き続きブロックされます。
</Warning>

## 一般的なルート

| 目的                                                 | モデル参照                                          | 認証                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API 課金による OpenAI 画像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex サブスクリプション認証による OpenAI 画像生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth |
| DeepInfra 画像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表現豊かな/スタイル指定の生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 画像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 画像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 画像生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` または Entra ID     |
| Google Gemini 画像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` または `GOOGLE_API_KEY`   |

同じツールで、テキストから画像の生成と参照画像の編集を処理します。参照が 1 つの場合は `image`、複数の場合は `images` を使用します。fal 上の Krea 2 モデルでは、これらの参照は編集入力ではなくスタイル参照として送信されます。
`quality`、`outputFormat`、`background` などのプロバイダー対応の出力ヒントは、利用可能な場合に転送され、プロバイダーが対応を宣言していない場合は無視されたものとして報告されます。バンドルされた透明背景対応は OpenAI 固有です。他のプロバイダーでも、バックエンドが出力する場合は PNG アルファを保持できることがあります。

## 対応プロバイダー

| プロバイダー          | デフォルトモデル                           | 編集対応                       | 認証                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | はい（1 画像、ワークフロー設定） | クラウドでは `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | はい（1 画像）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | はい（モデル固有の制限）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | はい（最大 5 画像）               | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | はい（最大 5 入力画像）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | はい（MAI-Image-2.5 モデルのみ）    | `AZURE_OPENAI_API_KEY` または Entra ID（`az login`）       |
| MiniMax           | `image-01`                              | はい（被写体参照）            | `MINIMAX_API_KEY` または MiniMax OAuth（`minimax-portal`） |
| OpenAI            | `gpt-image-2`                           | はい（最大 5 画像）               | `OPENAI_API_KEY` または OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | はい（最大 5 入力画像）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | はい（最大 5 画像）               | `XAI_API_KEY`                                         |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"` を使用します。

```text
/tool image_generate action=list
```

現在のセッションでアクティブな画像生成タスクを確認するには、`action: "status"` を使用します。

```text
/tool image_generate action=status
```

## プロバイダー機能

| 機能            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数）  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 編集 / 参照      | 1 画像（ワークフロー） | 1 画像   | Flux: 1; GPT: 10; Krea スタイル参照: 10; NB2: 14 | 最大 5 画像 | 1 画像           | 1 画像（被写体参照） | 最大 5 画像 | -     | 最大 5 画像 |
| サイズ制御          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最大 4K       | -     | -              |
| アスペクト比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 解像度（1K/2K/4K） | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  画像生成プロンプト。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  アクティブなセッションタスクを確認するには `"status"`、実行時に利用可能なプロバイダーとモデルを確認するには `"list"` を使用します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルの上書き（例: `openai/gpt-image-2`）。透明な OpenAI 背景には `openai/gpt-image-1.5` を使用します。
</ParamField>
<ParamField path="image" type="string">
  編集モード用の単一参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  編集モードまたはスタイル参照モデル用の複数参照画像（共有ツール経由では最大 14。プロバイダー固有の制限は引き続き適用されます）。
</ParamField>
<ParamField path="size" type="string">
  サイズヒント: `1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  アスペクト比: `1:1`、`2:1`、`20:9`、`19.5:9`、`2:3`、`3:2`、`2.35:1`、`3:4`、
  `4:3`、`4:5`、`5:4`、`9:16`、`9:19.5`、`9:20`、`16:9`、`21:9`、`1:2`、`4:1`、
  `1:4`、`8:1`、`1:8`。プロバイダーはモデル固有のサブセットを検証します。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解像度ヒント。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  プロバイダーが対応している場合の品質ヒント。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  プロバイダーが対応している場合の出力形式ヒント。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  プロバイダーが対応している場合の背景ヒント。透明対応プロバイダーでは、`outputFormat: "png"` または `"webp"` とともに `transparent` を使用します。
</ParamField>
<ParamField path="count" type="number">生成する画像数（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  任意のプロバイダーリクエストタイムアウト（ミリ秒）。Codex が動的ツール経由で `image_generate` を呼び出す場合でも、この呼び出しごとの値は設定済みデフォルトを上書きし、600000 ms を上限とします。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="openai" type="object">
  OpenAI 専用ヒント: `background`、`moderation`、`outputCompression`、`user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 の創造性制御。デフォルトは `medium` です。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。フォールバックプロバイダーが、リクエストされた正確なものではなく近いジオメトリオプションに対応している場合、OpenClaw は送信前に、対応している最も近いサイズ、アスペクト比、または解像度へ再マッピングします。対応が宣言されていないプロバイダーでは、非対応の出力ヒントは破棄され、ツール結果で報告されます。ツール結果には適用された設定が報告されます。`details.normalization` には、リクエスト内容から適用内容への変換が記録されます。
</Note>

## 設定

### モデル選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
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

OpenClaw は次の順序でプロバイダーを試行します。

1. ツール呼び出しの **`model` パラメーター**（エージェントが指定した場合）。
2. 設定の **`imageGenerationModel.primary`**。
3. **`imageGenerationModel.fallbacks`** を順番に。
4. **自動検出** - 認証に裏付けられたプロバイダーのデフォルトのみ:
   - 現在のデフォルトプロバイダーを最初に使用;
   - 残りの登録済み画像生成プロバイダーをプロバイダー ID 順に使用。

プロバイダーが失敗した場合（認証エラー、レート制限など）、次に設定された
候補が自動的に試行されます。すべて失敗した場合、エラーには各試行の詳細が
含まれます。

<AccordionGroup>
  <Accordion title="呼び出しごとのモデル上書きは厳密です">
    呼び出しごとの `model` 上書きは、そのプロバイダー/モデルだけを試行し、
    設定済みの primary/fallback や自動検出されたプロバイダーには
    続行しません。
  </Accordion>
  <Accordion title="自動検出は認証を考慮します">
    プロバイダーのデフォルトは、OpenClaw がそのプロバイダーを実際に
    認証できる場合にのみ候補リストに入ります。
    明示的な `model`、`primary`、`fallbacks` エントリだけを使用するには
    `agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。
  </Accordion>
  <Accordion title="タイムアウト">
    遅い画像バックエンドには `agents.defaults.imageGenerationModel.timeoutMs`
    を設定します。呼び出しごとの `timeoutMs` ツールパラメーターは設定済みの
    デフォルトを上書きし、設定済みのデフォルトは Plugin 作成のプロバイダー
    デフォルトを上書きします。Google と OpenRouter のホスト型画像プロバイダーは
    180 秒のデフォルトを使用します。Microsoft Foundry MAI、xAI、Azure OpenAI の
    画像生成は 600 秒を使用します。Codex の動的ツール呼び出しは 120 秒の
    `image_generate` ブリッジデフォルトを使用し、設定されている場合は同じ
    タイムアウト予算を尊重します。ただし OpenClaw の動的ツールブリッジ上限
    600000 ms に制限されます。
  </Accordion>
  <Accordion title="実行時に検査">
    現在登録されているプロバイダー、そのデフォルトモデル、認証環境変数のヒントを
    検査するには `action: "list"` を使用します。
  </Accordion>
</AccordionGroup>

### 画像編集

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI、xAI は参照画像の編集をサポートします。fal の Krea 2 モデルは、
編集入力ではなくスタイル参照として同じ `image` / `images` フィールドを
使用します。参照画像のパスまたは URL を渡します:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は `images` パラメーターで最大 5 枚の
参照画像をサポートします。fal は Flux image-to-image では 1 枚、
GPT Image 2 編集では最大 10 枚、Krea 2 のスタイル参照では最大 10 枚、
Nano Banana 2 編集では最大 14 枚をサポートします。Microsoft Foundry、
MiniMax、ComfyUI は 1 枚をサポートします。

## プロバイダーの詳細

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（および gpt-image-1.5）">
    OpenAI 画像生成のデフォルトは `openai/gpt-image-2` です。
    `openai` OAuth プロファイルが設定されている場合、OpenClaw は
    Codex サブスクリプションチャットモデルで使用される同じ OAuth
    プロファイルを再利用し、画像リクエストを Codex Responses バックエンド経由で
    送信します。`https://chatgpt.com/backend-api` のようなレガシー Codex
    ベース URL は、画像リクエスト用に
    `https://chatgpt.com/backend-api/codex` へ正規化されます。OpenClaw は
    そのリクエストで **暗黙的に** `OPENAI_API_KEY` へフォールバックしません -
    OpenAI Images API への直接ルーティングを強制するには、API キー、カスタム
    ベース URL、または Azure エンドポイントを使って `models.providers.openai`
    を明示的に設定します。

    `openai/gpt-image-1.5`、`openai/gpt-image-1`、
    `openai/gpt-image-1-mini` モデルは引き続き明示的に選択できます。
    透明背景の PNG/WebP 出力には `gpt-image-1.5` を使用します。現在の
    `gpt-image-2` API は `background: "transparent"` を拒否します。

    `gpt-image-2` は、同じ `image_generate` ツールを通じてテキストから画像の生成と
    参照画像編集の両方をサポートします。OpenClaw は `prompt`、`count`、
    `size`、`quality`、`outputFormat`、参照画像を OpenAI に転送します。
    OpenAI は `aspectRatio` や `resolution` を直接受け取りません。可能な場合、
    OpenClaw はそれらをサポートされる `size` にマッピングし、それ以外の場合は
    ツールが無視された上書きとして報告します。

    OpenAI 固有のオプションは `openai` オブジェクトの下にあります:

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

    `openai.background` は `transparent`、`opaque`、`auto` を受け付けます。
    透明出力には `outputFormat` `png` または `webp` と、透明に対応した
    OpenAI 画像モデルが必要です。OpenClaw はデフォルトの `gpt-image-2`
    透明背景リクエストを `gpt-image-1.5` にルーティングします。
    `openai.outputCompression` は JPEG/WebP 出力に適用され、PNG 出力では
    無視されます。

    トップレベルの `background` ヒントはプロバイダー中立であり、現在は
    OpenAI プロバイダーが選択されている場合に同じ OpenAI `background`
    リクエストフィールドへマッピングされます。背景サポートを宣言していない
    プロバイダーでは、サポートされないパラメーターを受け取る代わりに
    `ignoredOverrides` で返されます。

    `api.openai.com` ではなく Azure OpenAI デプロイメント経由で OpenAI 画像生成を
    ルーティングするには、
    [Azure OpenAI エンドポイント](/ja-JP/providers/openai#azure-openai-endpoints)を参照してください。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 画像モデル">
    Microsoft Foundry 画像生成は、`microsoft-foundry/` プロバイダー接頭辞の下で
    デプロイ済み MAI 画像デプロイメント名を使用します。MAI API は `model`
    フィールドにデプロイメント名を想定するため、プロバイダーレベルの
    デフォルトモデルはありません:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    このプロバイダーは OpenAI Images API ではなく Microsoft Foundry の MAI API を
    使用します:

    - 生成エンドポイント: `/mai/v1/images/generations`
    - 編集エンドポイント: `/mai/v1/images/edits`
    - 認証: `AZURE_OPENAI_API_KEY` / プロバイダー API キー、または `az login` による Entra ID
    - 出力: 1 枚の PNG 画像
    - サイズ: デフォルトは `1024x1024`; 幅と高さはそれぞれ 768 px 以上、
      総ピクセル数は最大 1,048,576
    - 編集: 1 枚の PNG または JPEG 参照画像。`MAI-Image-2.5-Flash` と
      `MAI-Image-2.5` デプロイメントでのみサポート

    プロンプトのみの生成では、Foundry エンドポイントだけを設定してカスタム
    デプロイメント名を使用できます。カスタムデプロイメント名での編集には、
    OpenClaw がそのデプロイメントが `MAI-Image-2.5-Flash` または
    `MAI-Image-2.5` によって裏付けられていることを検証できるように、
    オンボーディング/モデルメタデータが必要です。

    現在の MAI 画像モデルは `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e`、`MAI-Image-2` です。セットアップとチャットモデルの動作については
    [Microsoft Foundry Plugin](/ja-JP/plugins/reference/microsoft-foundry) を参照してください。

  </Accordion>
  <Accordion title="OpenRouter 画像モデル">
    OpenRouter 画像生成は同じ `OPENROUTER_API_KEY` を使用し、OpenRouter の
    チャット補完画像 API 経由でルーティングします。`openrouter/` 接頭辞で
    OpenRouter 画像モデルを選択します:

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

    OpenClaw は `prompt`、`count`、参照画像、Gemini 互換の
    `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。
    現在の組み込み OpenRouter 画像モデルショートカットには
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` が
    含まれます。設定済み Plugin が公開している内容を確認するには
    `action: "list"` を使用します。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal の Krea 2 モデルは、Flux で使用される汎用 `image_size` スキーマではなく、
    fal のネイティブ Krea スキーマを使用します。OpenClaw は次を送信します:

    - アスペクト比ヒント用の `aspect_ratio`
    - `creativity`。デフォルトは `medium`
    - `image` または `images` が指定された場合の `image_style_references`

    より高速で表現力のあるイラストには Krea 2 Medium を、より遅いが詳細な
    フォトリアルで質感のある見た目には Krea 2 Large を選択します:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 は現在、リクエストごとに 1 枚の画像を返します。Krea には
    `aspectRatio` を優先してください。OpenClaw は `size` を最も近い
    サポート済み Krea アスペクト比にマッピングし、Krea では `resolution` を
    黙って落とすのではなく拒否します。ネイティブ Krea の創造性レベルを
    使いたい場合は `fal.creativity` を使用します:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax 画像生成は、バンドルされた両方の MiniMax 認証パスから利用できます:

    - API キー設定用の `minimax/image-01`
    - OAuth 設定用の `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    バンドルされた xAI プロバイダーは、プロンプトのみのリクエストには
    `/v1/images/generations` を使用し、`image` または `images` が存在する場合は
    `/v1/images/edits` を使用します。

    - モデル: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - 数: 最大 4
    - 参照: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 出力: OpenClaw 管理の画像添付として返されます

    OpenClaw は、共有のクロスプロバイダー `image_generate` 契約に
    それらのコントロールが存在するまで、xAI ネイティブの `quality`、`mask`、
    `user`、追加のネイティブ専用アスペクト比を意図的に公開しません。

  </Accordion>
</AccordionGroup>

## 例

<Tabs>
  <Tab title="生成（4K 横長）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

同等の CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="生成（OpenAI 低品質）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

同等の CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="生成（2つの正方形）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編集（1つの参照）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編集（複数の参照）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea スタイル参照">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

同じ `--output-format`、`--background`、`--quality`、および
`--openai-moderation` フラグは `openclaw infer image edit` でも使用できます。
`--openai-background` は OpenAI 固有のエイリアスとして残ります。OpenAI 以外のバンドル済みプロバイダーは
現在、明示的な背景制御を宣言していないため、それらでは
`background: "transparent"` は無視されたものとして報告されます。

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [ComfyUI](/ja-JP/providers/comfy) - local ComfyUI と Comfy Cloud のワークフロー設定
- [fal](/ja-JP/providers/fal) - fal 画像および動画プロバイダー設定
- [Google (Gemini)](/ja-JP/providers/google) - Gemini 画像プロバイダー設定
- [Microsoft Foundry plugin](/ja-JP/plugins/reference/microsoft-foundry) - Microsoft Foundry チャットおよび MAI 画像設定
- [MiniMax](/ja-JP/providers/minimax) - MiniMax 画像プロバイダー設定
- [OpenAI](/ja-JP/providers/openai) - OpenAI Images プロバイダー設定
- [Vydra](/ja-JP/providers/vydra) - Vydra 画像、動画、音声設定
- [xAI](/ja-JP/providers/xai) - Grok 画像、動画、検索、コード実行、TTS 設定
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [モデル](/ja-JP/concepts/models) - モデル設定とフェイルオーバー
