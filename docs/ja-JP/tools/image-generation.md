---
read_when:
    - エージェントによる画像の生成または編集
    - 画像生成プロバイダーとモデルの設定
    - image_generate ツールのパラメーターを理解する
sidebarTitle: Image generation
summary: OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra の image_generate 経由で画像を生成・編集する
title: 画像生成
x-i18n:
    generated_at: "2026-06-27T13:13:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` ツールを使うと、エージェントは設定済みの
プロバイダーを使用して画像を作成、編集できます。チャットセッションでは、画像生成は非同期で実行されます。
OpenClaw はバックグラウンドタスクを記録し、タスク ID をすぐに返し、
プロバイダーが完了するとエージェントを起動します。完了エージェントは
セッションの通常の表示返信モードに従います。設定されている場合は自動的に最終返信を配信し、
セッションが message ツールを必要とする場合は `message(action="send")` を使用します。
リクエスト元セッションが非アクティブであるか、そのアクティブな起動に失敗し、かつ
生成された画像の一部が完了返信にまだ含まれていない場合、OpenClaw は
不足している画像だけを含む冪等な直接フォールバックを送信します。

<Note>
このツールは、少なくとも 1 つの画像生成プロバイダーが
利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が
表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、プロバイダー API キーを設定するか、
OpenAI ChatGPT/Codex OAuth でサインインしてください。
</Note>

## クイックスタート

<Steps>
  <Step title="Configure auth">
    少なくとも 1 つのプロバイダーに API キーを設定します（例: `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`）。または OpenAI Codex OAuth でサインインします。
  </Step>
  <Step title="Pick a default model (optional)">
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

    ChatGPT/Codex OAuth は同じ `openai/gpt-image-2` モデル参照を使用します。
    `openai` OAuth プロファイルが設定されている場合、OpenClaw は画像リクエストを
    まず `OPENAI_API_KEY` を試すのではなく、その OAuth プロファイル経由でルーティングします。
    明示的な `models.providers.openai` 設定（API キー、
    カスタム/Azure ベース URL）を使うと、直接の OpenAI Images API
    ルートに戻ります。

  </Step>
  <Step title="Ask the agent">
    _「親しみやすいロボットのマスコットの画像を生成して。」_

    エージェントは自動的に `image_generate` を呼び出します。ツールの許可リスト登録は
    不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。このツールは
    バックグラウンドタスク ID を返し、準備ができると完了エージェントが生成された
    添付ファイルを `message` ツール経由で送信します。

  </Step>
</Steps>

<Warning>
LocalAI などの OpenAI 互換 LAN エンドポイントでは、カスタム
`models.providers.openai.baseUrl` を維持し、
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` で明示的にオプトインしてください。プライベートおよび
内部画像エンドポイントはデフォルトでは引き続きブロックされます。
</Warning>

## よく使うルート

| 目的                                                 | モデル参照                                          | 認証                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API 課金を使う OpenAI 画像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex サブスクリプション認証を使う OpenAI 画像生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth |
| DeepInfra 画像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 の表現力豊かな/スタイル指定生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 画像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 画像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 画像生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` または Entra ID     |
| Google Gemini 画像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` または `GOOGLE_API_KEY`   |

同じ `image_generate` ツールが、テキストから画像生成と参照画像の
編集を処理します。参照が 1 つの場合は `image` を、複数の参照には `images` を使用します。
fal の Krea 2 モデルでは、これらの参照は編集入力ではなく
スタイル参照として送信されます。
`quality`, `outputFormat`, `background` など、プロバイダーがサポートする出力ヒントは
利用可能な場合に転送され、プロバイダーがサポートしていない場合は
無視されたものとして報告されます。バンドルされた透明背景サポートは
OpenAI 固有です。他のプロバイダーでも、バックエンドが出力する場合は PNG アルファを保持することがあります。

## サポートされるプロバイダー

| プロバイダー          | デフォルトモデル                           | 編集サポート                       | 認証                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | はい（1 画像、ワークフロー設定） | クラウドでは `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | はい（1 画像）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | はい（モデル固有の制限）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | はい                                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | はい（最大 5 入力画像）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | はい（MAI-Image-2.5 モデルのみ）    | `AZURE_OPENAI_API_KEY` または Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | はい（被写体参照）            | `MINIMAX_API_KEY` または MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | はい（最大 4 画像）               | `OPENAI_API_KEY` または OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | はい（最大 5 入力画像）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | はい（最大 5 画像）               | `XAI_API_KEY`                                         |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"` を使用します。

```text
/tool image_generate action=list
```

現在のセッションのアクティブな画像生成タスクを確認するには、`action: "status"` を使用します。

```text
/tool image_generate action=status
```

## プロバイダー機能

| 機能            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数）  | ワークフロー定義   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 編集 / 参照      | 1 画像（ワークフロー） | 1 画像   | Flux: 1; GPT: 10; Krea スタイル参照: 10; NB2: 14 | 最大 5 画像 | 1 画像           | 1 画像（被写体参照） | 最大 5 画像 | -     | 最大 5 画像 |
| サイズ制御          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最大 4K       | -     | -              |
| アスペクト比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 解像度（1K/2K/4K） | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  画像生成プロンプト。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  アクティブなセッションタスクを確認するには `"status"` を、実行時に
  利用可能なプロバイダーとモデルを確認するには `"list"` を使用します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルのオーバーライド（例: `openai/gpt-image-2`）。透明な OpenAI 背景には
  `openai/gpt-image-1.5` を使用します。
</ParamField>
<ParamField path="image" type="string">
  編集モード用の単一の参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  編集モードまたはスタイル参照モデル用の複数の参照画像（共有ツール経由では最大 10。
  プロバイダー固有の制限は引き続き適用されます）。
</ParamField>
<ParamField path="size" type="string">
  サイズヒント: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  アスペクト比: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`。プロバイダーは
  モデル固有のサブセットを検証します。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解像度ヒント。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  プロバイダーがサポートする場合の品質ヒント。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  プロバイダーがサポートする場合の出力形式ヒント。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  プロバイダーがサポートする場合の背景ヒント。透明化対応プロバイダーでは、
  `outputFormat: "png"` または `"webp"` とともに `transparent` を使用します。
</ParamField>
<ParamField path="count" type="number">生成する画像数（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  任意のプロバイダーリクエストタイムアウト（ミリ秒）。Codex が
  動的ツール経由で `image_generate` を呼び出す場合でも、この呼び出しごとの値は
  設定済みデフォルトを上書きし、600000 ms が上限になります。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="openai" type="object">
  OpenAI 専用ヒント: `background`, `moderation`, `outputCompression`, `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 の創造性制御。デフォルトは `medium` です。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。フォールバックプロバイダーが
リクエストされた正確なものではなく近いジオメトリオプションをサポートしている場合、OpenClaw は送信前に
最も近いサポート済みサイズ、アスペクト比、または解像度へ再マッピングします。
サポートを宣言していないプロバイダーでは、サポートされない出力ヒントは削除され、
ツール結果で報告されます。ツール結果は適用された
設定を報告します。`details.normalization` は、リクエスト値から適用値への
変換を記録します。
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

OpenClaw は次の順序でプロバイダーを試します。

1. ツール呼び出しの **`model` パラメーター**（agent が指定した場合）。
2. config の **`imageGenerationModel.primary`**。
3. **`imageGenerationModel.fallbacks`**（順番どおり）。
4. **自動検出** - auth に裏付けられたプロバイダー既定値のみ:
   - 現在のデフォルトプロバイダーを最初に使用;
   - 残りの登録済み画像生成プロバイダーを provider-id 順に使用。

プロバイダーが失敗した場合（認証エラー、レート制限など）、次に設定された
候補が自動的に試行されます。すべて失敗した場合、エラーには各試行の詳細が
含まれます。

<AccordionGroup>
  <Accordion title="呼び出しごとのモデル上書きは厳密">
    呼び出しごとの `model` 上書きは、そのプロバイダー/モデルだけを試行し、
    設定された primary/fallback や自動検出されたプロバイダーには続行しません。
  </Accordion>
  <Accordion title="自動検出は認証を考慮">
    プロバイダーの既定値は、OpenClaw がそのプロバイダーを実際に認証できる
    場合にのみ候補リストに入ります。明示的な `model`、`primary`、`fallbacks`
    エントリだけを使用するには、`agents.defaults.mediaGenerationAutoProviderFallback: false`
    を設定します。
  </Accordion>
  <Accordion title="タイムアウト">
    遅い画像バックエンドには `agents.defaults.imageGenerationModel.timeoutMs` を設定します。
    呼び出しごとの `timeoutMs` ツールパラメーターは設定済みの既定値を上書きし、
    設定済みの既定値は Plugin 作成者が定義したプロバイダー既定値を上書きします。
    Google と OpenRouter のホスト型画像プロバイダーは 180 秒の既定値を使用します。
    Microsoft Foundry MAI、xAI、Azure OpenAI の画像生成は 600 秒を使用します。
    Codex の動的ツール呼び出しは 120 秒の `image_generate` ブリッジ既定値を使用し、
    設定されている場合は同じタイムアウト予算を尊重します。ただし OpenClaw の
    600000 ms の動的ツールブリッジ最大値に制限されます。
  </Accordion>
  <Accordion title="実行時に検査">
    現在登録されているプロバイダー、そのデフォルトモデル、認証 env-var ヒントを
    検査するには `action: "list"` を使用します。
  </Accordion>
</AccordionGroup>

### 画像編集

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI、xAI は参照画像の編集をサポートします。fal の Krea 2 モデルは、編集入力ではなく
スタイル参照として同じ `image` / `images` フィールドを使用します。参照画像のパスまたは URL を渡します:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は `images` パラメーターで最大 5 枚の参照画像を
サポートします。fal は Flux image-to-image で 1 枚、GPT Image 2 編集で最大 10 枚、
Krea 2 のスタイル参照で最大 10 枚、Nano Banana 2 編集で最大 14 枚の参照画像を
サポートします。Microsoft Foundry、MiniMax、ComfyUI は 1 枚をサポートします。

## プロバイダーの詳細

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（および gpt-image-1.5）">
    OpenAI 画像生成の既定値は `openai/gpt-image-2` です。
    `openai` OAuth プロファイルが設定されている場合、OpenClaw は Codex サブスクリプション
    チャットモデルで使用される同じ OAuth プロファイルを再利用し、画像リクエストを
    Codex Responses バックエンド経由で送信します。`https://chatgpt.com/backend-api`
    などのレガシー Codex ベース URL は、画像リクエスト向けに
    `https://chatgpt.com/backend-api/codex` に正規化されます。OpenClaw はそのリクエストで
    `OPENAI_API_KEY` に暗黙的にフォールバックすることは**ありません** - 直接 OpenAI Images API
    ルーティングを強制するには、API キー、カスタムベース URL、または Azure エンドポイントを指定して
    `models.providers.openai` を明示的に設定します。

    `openai/gpt-image-1.5`、`openai/gpt-image-1`、`openai/gpt-image-1-mini`
    モデルは、引き続き明示的に選択できます。透明背景の PNG/WebP 出力には
    `gpt-image-1.5` を使用します。現在の `gpt-image-2` API は
    `background: "transparent"` を拒否します。

    `gpt-image-2` は、同じ `image_generate` ツールを通じてテキストから画像の生成と
    参照画像編集の両方をサポートします。OpenClaw は `prompt`、`count`、`size`、
    `quality`、`outputFormat`、参照画像を OpenAI に転送します。OpenAI は
    `aspectRatio` や `resolution` を直接受け取り**ません**。可能な場合、OpenClaw は
    それらをサポートされる `size` にマップし、それ以外の場合はツールが
    ignored overrides として報告します。

    OpenAI 固有のオプションは `openai` オブジェクト配下にあります:

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

    `openai.background` は `transparent`、`opaque`、`auto` を受け入れます。
    透明出力には `outputFormat` `png` または `webp` と、透明化に対応した
    OpenAI 画像モデルが必要です。OpenClaw はデフォルトの `gpt-image-2` 透明背景リクエストを
    `gpt-image-1.5` にルーティングします。`openai.outputCompression` は JPEG/WebP 出力に
    適用され、PNG 出力では無視されます。

    最上位の `background` ヒントはプロバイダー中立であり、現在は OpenAI プロバイダーが
    選択された場合に同じ OpenAI `background` リクエストフィールドにマップされます。
    背景サポートを宣言していないプロバイダーは、サポートされないパラメーターを受け取る代わりに
    `ignoredOverrides` で返します。

    `api.openai.com` ではなく Azure OpenAI デプロイメント経由で OpenAI 画像生成を
    ルーティングするには、
    [Azure OpenAI エンドポイント](/ja-JP/providers/openai#azure-openai-endpoints)を参照してください。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 画像モデル">
    Microsoft Foundry の画像生成は、`microsoft-foundry/` プロバイダープレフィックス配下の
    デプロイ済み MAI 画像デプロイメント名を使用します。MAI API は `model` フィールドに
    デプロイメント名を期待するため、プロバイダーレベルのデフォルトモデルはありません:

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

    このプロバイダーは OpenAI Images API ではなく、Microsoft Foundry の MAI API を使用します:

    - 生成エンドポイント: `/mai/v1/images/generations`
    - 編集エンドポイント: `/mai/v1/images/edits`
    - 認証: `AZURE_OPENAI_API_KEY` / プロバイダー API キー、または `az login` 経由の Entra ID
    - 出力: 1 枚の PNG 画像
    - サイズ: 既定値は `1024x1024`; 幅と高さはそれぞれ少なくとも 768 px で、
      総ピクセル数は最大 1,048,576
    - 編集: 1 枚の PNG または JPEG 参照画像。`MAI-Image-2.5-Flash` と
      `MAI-Image-2.5` デプロイメントでのみサポート

    プロンプトのみの生成では、Foundry エンドポイントだけを設定してカスタムデプロイメント名を
    使用できます。カスタムデプロイメント名での編集には、そのデプロイメントが
    `MAI-Image-2.5-Flash` または `MAI-Image-2.5` によって裏付けられていることを
    OpenClaw が検証できるよう、オンボーディング/モデルメタデータが必要です。

    現在の MAI 画像モデルは `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e`、`MAI-Image-2` です。セットアップとチャットモデルの挙動については
    [Microsoft Foundry Plugin](/ja-JP/plugins/reference/microsoft-foundry) を参照してください。

  </Accordion>
  <Accordion title="OpenRouter 画像モデル">
    OpenRouter 画像生成は同じ `OPENROUTER_API_KEY` を使用し、OpenRouter のチャット補完画像 API
    経由でルーティングします。`openrouter/` プレフィックスで OpenRouter 画像モデルを選択します:

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

    OpenClaw は `prompt`、`count`、参照画像、Gemini 互換の `aspectRatio` / `resolution`
    ヒントを OpenRouter に転送します。現在の組み込み OpenRouter 画像モデルショートカットには
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` が含まれます。
    設定済み Plugin が公開している内容を確認するには `action: "list"` を使用します。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal の Krea 2 モデルは、Flux で使用される汎用 `image_size` スキーマではなく、
    fal のネイティブ Krea スキーマを使用します。OpenClaw は次を送信します:

    - アスペクト比ヒントには `aspect_ratio`
    - `creativity`（既定値は `medium`）
    - `image` または `images` が指定された場合は `image_style_references`

    より高速で表現豊かなイラストには Krea 2 Medium を、より低速で詳細なフォトリアルおよび
    テクスチャ表現には Krea 2 Large を選択します:

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

    Krea 2 は現在、リクエストごとに 1 枚の画像を返します。Krea では `aspectRatio` を
    優先してください。OpenClaw は `size` を最も近いサポート済み Krea アスペクト比にマップし、
    `resolution` は破棄せずに Krea では拒否します。ネイティブ Krea の creativity レベルを
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
  <Accordion title="MiniMax デュアル認証">
    MiniMax 画像生成は、バンドルされた両方の MiniMax 認証パスから利用できます:

    - API キー設定には `minimax/image-01`
    - OAuth 設定には `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    バンドルされた xAI プロバイダーは、プロンプトのみのリクエストには `/v1/images/generations` を使用し、
    `image` または `images` が存在する場合は `/v1/images/edits` を使用します。

    - モデル: `xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 数: 最大 4
    - 参照: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解像度: `1K`、`2K`
    - 出力: OpenClaw 管理の画像添付として返されます

    OpenClaw は、共有クロスプロバイダー `image_generate` 契約にそれらの制御が存在するまで、
    xAI ネイティブの `quality`、`mask`、`user`、または追加のネイティブ専用アスペクト比を
    意図的に公開しません。

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
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
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
- [ComfyUI](/ja-JP/providers/comfy) - ローカル ComfyUI と Comfy Cloud ワークフローのセットアップ
- [fal](/ja-JP/providers/fal) - fal 画像および動画プロバイダーのセットアップ
- [Google (Gemini)](/ja-JP/providers/google) - Gemini 画像プロバイダーのセットアップ
- [Microsoft Foundry Plugin](/ja-JP/plugins/reference/microsoft-foundry) - Microsoft Foundry チャットと MAI 画像のセットアップ
- [MiniMax](/ja-JP/providers/minimax) - MiniMax 画像プロバイダーのセットアップ
- [OpenAI](/ja-JP/providers/openai) - OpenAI Images プロバイダーのセットアップ
- [Vydra](/ja-JP/providers/vydra) - Vydra 画像、動画、音声のセットアップ
- [xAI](/ja-JP/providers/xai) - Grok 画像、動画、検索、コード実行、TTS のセットアップ
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [モデル](/ja-JP/concepts/models) - モデル設定とフェイルオーバー
