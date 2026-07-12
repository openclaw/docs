---
read_when:
    - エージェントによる画像の生成または編集
    - 画像生成プロバイダーとモデルの設定
    - image_generate ツールのパラメータを理解する
sidebarTitle: Image generation
summary: OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra の image_generate を使用して画像を生成・編集する
title: 画像生成
x-i18n:
    generated_at: "2026-07-12T14:56:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate`ツールは、設定済みのプロバイダーを通じて画像を生成・編集します。チャットセッションでは非同期で実行されます。OpenClawはバックグラウンドタスクを記録し、タスクIDをすぐに返し、プロバイダーの処理が完了するとエージェントを起動します。完了処理を行うエージェントは、セッションの通常の表示返信モードに従います。設定されている場合は最終返信を自動配信し、セッションでメッセージツールが必要な場合は`message(action="send")`を使用します。リクエスト元のセッションが非アクティブであるか、アクティブな起動に失敗した場合、結果が失われないように、OpenClawは生成された画像を含む冪等な直接フォールバックを送信します。

<Note>
このツールは、少なくとも1つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに`image_generate`が表示されない場合は、`agents.defaults.imageGenerationModel`を設定し、プロバイダーのAPIキーをセットアップするか、OpenAI ChatGPT/Codex OAuthでサインインしてください。
</Note>

## クイックスタート

<Steps>
  <Step title="認証を設定する">
    少なくとも1つのプロバイダーのAPIキー（例：`OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）を設定するか、OpenAI Codex OAuthでサインインします。
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

    ChatGPT/Codex OAuthでは、同じ`openai/gpt-image-2`モデル参照を使用します。`openai` OAuthプロファイルが設定されている場合、OpenClawは最初に`OPENAI_API_KEY`を試す代わりに、そのOAuthプロファイルを通じて画像リクエストをルーティングします。明示的な`models.providers.openai`設定（APIキー、カスタム/AzureベースURL）を指定すると、OpenAI Images APIへの直接ルートが再び有効になります。

  </Step>
  <Step title="エージェントに依頼する">
    _「親しみやすいロボットのマスコット画像を生成してください。」_

    エージェントは`image_generate`を自動的に呼び出します。ツールの許可リストへの追加は不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。ツールはバックグラウンドタスクIDを返し、準備が整うと、完了処理を行うエージェントが`message`ツールを通じて生成された添付ファイルを送信します。

  </Step>
</Steps>

<Warning>
LocalAIなどのOpenAI互換LANエンドポイントでは、カスタム`models.providers.openai.baseUrl`を維持し、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`を指定して明示的にオプトインしてください。プライベートおよび内部の画像エンドポイントは、デフォルトでは引き続きブロックされます。
</Warning>

## 一般的なルート

| 目的                                                 | モデル参照                                          | 認証                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API課金によるOpenAI画像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codexサブスクリプション認証によるOpenAI画像生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAIによる背景透過PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY`またはOpenAI Codex OAuth |
| DeepInfra画像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2による表現力重視／スタイル指定の生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter画像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM画像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI画像生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY`またはEntra ID     |
| Google Gemini画像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY`または`GOOGLE_API_KEY`   |

同じツールで、テキストからの画像生成と参照画像の編集を処理します。参照画像が1つの場合は`image`、複数の場合は`images`を使用します。fal上のKrea 2モデルでは、これらの参照画像は編集入力ではなくスタイル参照として送信されます。`quality`、`outputFormat`、`background`など、プロバイダーが対応する出力ヒントは、利用可能な場合に転送され、プロバイダーが対応を宣言していない場合は無視されたものとして報告されます。同梱の背景透過対応はOpenAI固有です。他のプロバイダーでも、バックエンドがPNGのアルファチャンネルを出力する場合は保持されることがあります。

## 対応プロバイダー

| プロバイダー          | デフォルトモデル                           | 編集対応                       | 認証                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 対応（1画像、ワークフローで設定） | クラウドの場合は`COMFY_API_KEY`または`COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 対応（1画像）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 対応（モデル固有の制限あり）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 対応（最大5画像）               | `GEMINI_API_KEY`または`GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 対応（最大5入力画像）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 対応（MAI-Image-2.5モデルのみ）    | `AZURE_OPENAI_API_KEY`またはEntra ID（`az login`）       |
| MiniMax           | `image-01`                              | 対応（被写体参照）            | `MINIMAX_API_KEY`またはMiniMax OAuth（`minimax-portal`） |
| OpenAI            | `gpt-image-2`                           | 対応（最大5画像）               | `OPENAI_API_KEY`またはOpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 対応（最大5入力画像）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 非対応                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 対応（最大3画像）               | `XAI_API_KEY`                                         |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"`を使用します。

```text
/tool image_generate action=list
```

現在のセッションでアクティブな画像生成タスクを確認するには、`action: "status"`を使用します。

```text
/tool image_generate action=status
```

## プロバイダーの機能

| 機能            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数）  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 編集／参照      | 1画像（ワークフロー） | 1画像   | Flux：1、GPT：10、Kreaスタイル参照：10、NB2：14 | 最大5画像 | 1画像           | 1画像（被写体参照） | 最大5画像 | -     | 最大3画像 |
| サイズ制御          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最大4K       | -     | -              |
| アスペクト比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 解像度（1K/2K/4K） | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K、2K         |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  画像生成プロンプト。`action: "generate"`では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  アクティブなセッションタスクを確認するには`"status"`、実行時に利用可能なプロバイダーとモデルを確認するには`"list"`を使用します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー／モデルの上書き（例：`openai/gpt-image-2`）。OpenAIで背景を透過するには`openai/gpt-image-1.5`を使用します。
</ParamField>
<ParamField path="image" type="string">
  編集モード用の単一の参照画像パスまたはURL。
</ParamField>
<ParamField path="images" type="string[]">
  編集モードまたはスタイル参照モデル用の複数の参照画像（共有ツール経由では最大14画像。プロバイダー固有の制限も引き続き適用されます）。
</ParamField>
<ParamField path="size" type="string">
  サイズのヒント：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  アスペクト比：`1:1`、`2:1`、`20:9`、`19.5:9`、`2:3`、`3:2`、`2.35:1`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`9:19.5`、`9:20`、`16:9`、`21:9`、`1:2`、`4:1`、`1:4`、`8:1`、`1:8`。プロバイダーは、各モデル固有のサブセットを検証します。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解像度のヒント。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  プロバイダーが対応している場合の品質のヒント。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  プロバイダーが対応している場合の出力形式のヒント。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  プロバイダーが対応している場合の背景のヒント。透過に対応するプロバイダーでは、`transparent`を`outputFormat: "png"`または`"webp"`とともに使用します。
</ParamField>
<ParamField path="count" type="number">生成する画像の数（1～4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  任意のプロバイダーリクエストタイムアウト（ミリ秒単位）。Codexが動的ツールを通じて`image_generate`を呼び出す場合も、この呼び出しごとの値が設定済みのデフォルトを上書きし、上限は600000 msです。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="openai" type="object">
  OpenAI専用のヒント：`background`、`moderation`、`outputCompression`、`user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2の創造性制御。デフォルトは`medium`です。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。フォールバックプロバイダーが、要求されたものと完全に一致するオプションではなく近似するジオメトリオプションに対応している場合、OpenClawは送信前に、最も近い対応サイズ、アスペクト比、または解像度に再マッピングします。対応を宣言していないプロバイダーでは、未対応の出力ヒントは削除され、ツール結果で報告されます。ツール結果には適用された設定が報告され、`details.normalization`には要求値から適用値への変換が記録されます。
</Note>

## 設定

### モデルの選択

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

### プロバイダーの選択順序

OpenClawは次の順序でプロバイダーを試します。

1. ツール呼び出しの **`model` パラメーター**（エージェントが指定した場合）。
2. 設定の **`imageGenerationModel.primary`**。
3. 順番どおりの **`imageGenerationModel.fallbacks`**。
4. **自動検出** - 認証情報があるプロバイダーのデフォルトのみ：
   - 現在のデフォルトプロバイダーを最初に使用；
   - 残りの登録済み画像生成プロバイダーをプロバイダー ID 順に使用。

プロバイダーが失敗した場合（認証エラー、レート制限など）、次に設定された
候補が自動的に試行されます。すべて失敗した場合、エラーには各試行の
詳細が含まれます。

<AccordionGroup>
  <Accordion title="呼び出しごとのモデルオーバーライドは厳密">
    呼び出しごとの `model` オーバーライドでは、そのプロバイダー／モデルのみを試行し、
    設定済みのプライマリ／フォールバックや自動検出されたプロバイダーには進みません。
  </Accordion>
  <Accordion title="自動検出は認証状態を考慮">
    OpenClaw が実際にそのプロバイダーを認証できる場合にのみ、
    プロバイダーのデフォルトが候補リストに追加されます。明示的な
    `model`、`primary`、`fallbacks` エントリのみを使用するには、
    `agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。
  </Accordion>
  <Accordion title="タイムアウト">
    低速な画像バックエンドには `agents.defaults.imageGenerationModel.timeoutMs` を
    設定します。呼び出しごとの `timeoutMs` ツールパラメーターは設定済みの
    デフォルトを上書きし、設定済みのデフォルトは Plugin が定義したプロバイダーの
    デフォルトを上書きします。Google および OpenRouter がホストする画像プロバイダーの
    デフォルトは 180 秒です。Microsoft Foundry MAI、xAI、Azure OpenAI の画像生成では
    600 秒です。Codex の動的ツール呼び出しでは、`image_generate` ブリッジのデフォルトとして
    120 秒を使用し、設定されている場合は同じタイムアウト時間を尊重します。ただし、
    OpenClaw の動的ツールブリッジの上限である 600000 ms に制限されます。
  </Accordion>
  <Accordion title="実行時に確認">
    現在登録されているプロバイダー、そのデフォルトモデル、および認証用環境変数の
    ヒントを確認するには、`action: "list"` を使用します。
  </Accordion>
</AccordionGroup>

### 画像編集

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI、xAI は、参照画像の編集をサポートします。fal 上の Krea 2 モデルでは、
同じ `image` / `images` フィールドを編集入力ではなくスタイル参照として
使用します。参照画像のパスまたは URL を渡します：

```text
「この写真の水彩画版を生成」 + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google は `images` パラメーターで最大 5 枚の参照画像を
サポートし、xAI は最大 3 枚をサポートします。fal は Flux の画像間変換で 1 枚、
GPT Image 2 の編集で最大 10 枚、Krea 2 のスタイル参照で最大 10 枚、
Nano Banana 2 の編集で最大 14 枚の参照画像をサポートします。Microsoft Foundry、
MiniMax、ComfyUI は 1 枚をサポートします。

## プロバイダーの詳細

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（および gpt-image-1.5）">
    OpenAI の画像生成は、デフォルトで `openai/gpt-image-2` を使用します。
    `openai` OAuth プロファイルが設定されている場合、OpenClaw は
    Codex サブスクリプションのチャットモデルで使用されるものと同じ
    OAuth プロファイルを再利用し、Codex Responses バックエンド経由で
    画像リクエストを送信します。`https://chatgpt.com/backend-api` などの
    従来の Codex ベース URL は、画像リクエストでは
    `https://chatgpt.com/backend-api/codex` に正規化されます。OpenClaw は
    そのリクエストで `OPENAI_API_KEY` に暗黙的にフォールバック**しません**。
    OpenAI Images API への直接ルーティングを強制するには、API キー、
    カスタムベース URL、または Azure エンドポイントを使用して
    `models.providers.openai` を明示的に設定します。

    `openai/gpt-image-1.5`、`openai/gpt-image-1`、
    `openai/gpt-image-1-mini` モデルも、引き続き明示的に選択できます。
    背景が透明な PNG/WebP 出力には `gpt-image-1.5` を使用してください。
    現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

    `gpt-image-2` は、同じ `image_generate` ツールを通じて、
    テキストからの画像生成と参照画像の編集の両方をサポートします。
    OpenClaw は `prompt`、`count`、`size`、`quality`、`outputFormat`、
    および参照画像を OpenAI に転送します。OpenAI は `aspectRatio` や
    `resolution` を直接受け取りません。可能な場合、OpenClaw はそれらを
    サポートされる `size` に変換し、それ以外の場合はツールが無視された
    オーバーライドとして報告します。

    OpenAI 固有のオプションは `openai` オブジェクト内に配置します：

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

    `openai.background` には `transparent`、`opaque`、`auto` を指定できます。
    透明出力には `outputFormat` として `png` または `webp` を指定し、
    透明度をサポートする OpenAI 画像モデルを使用する必要があります。
    OpenClaw は、デフォルトの `gpt-image-2` に対する背景透明リクエストを
    `gpt-image-1.5` にルーティングします。`openai.outputCompression` は
    JPEG/WebP 出力に適用され、PNG 出力では無視されます。

    トップレベルの `background` ヒントはプロバイダーに依存せず、現在は
    OpenAI プロバイダーが選択された場合に同じ OpenAI の `background`
    リクエストフィールドへマッピングされます。背景をサポートすると宣言していない
    プロバイダーでは、サポートされていないパラメーターを受け取る代わりに、
    それが `ignoredOverrides` に返されます。

    OpenAI の画像生成を `api.openai.com` ではなく Azure OpenAI
    デプロイメント経由でルーティングするには、
    [Azure OpenAI エンドポイント](/ja-JP/providers/openai#azure-openai-endpoints)を参照してください。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 画像モデル">
    Microsoft Foundry の画像生成では、`microsoft-foundry/` プロバイダー接頭辞の下で、
    デプロイ済み MAI 画像デプロイメント名を使用します。MAI API は `model`
    フィールドにデプロイメント名を要求するため、プロバイダーレベルの
    デフォルトモデルはありません：

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

    このプロバイダーは OpenAI Images API ではなく、Microsoft Foundry の MAI API を使用します：

    - 生成エンドポイント：`/mai/v1/images/generations`
    - 編集エンドポイント：`/mai/v1/images/edits`
    - 認証：`AZURE_OPENAI_API_KEY` / プロバイダー API キー、または `az login` を介した Entra ID
    - 出力：1 枚の PNG 画像
    - サイズ：デフォルトは `1024x1024`。幅と高さはそれぞれ少なくとも 768 px、
      総ピクセル数は最大 1,048,576
    - 編集：1 枚の PNG または JPEG 参照画像。`MAI-Image-2.5-Flash` および
      `MAI-Image-2.5` デプロイメントでのみサポート

    プロンプトのみの生成では、Foundry エンドポイントを設定するだけで、
    カスタムデプロイメント名を使用できます。カスタムデプロイメント名による編集には、
    そのデプロイメントが `MAI-Image-2.5-Flash` または `MAI-Image-2.5` に
    基づいていることを OpenClaw が検証できるように、オンボーディング／モデルの
    メタデータが必要です。

    現在の MAI 画像モデルは `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e`、`MAI-Image-2` です。セットアップおよびチャットモデルの
    動作については、[Microsoft Foundry Plugin](/ja-JP/plugins/reference/microsoft-foundry)を
    参照してください。

  </Accordion>
  <Accordion title="OpenRouter 画像モデル">
    OpenRouter の画像生成では同じ `OPENROUTER_API_KEY` を使用し、
    OpenRouter のチャット補完画像 API 経由でルーティングします。
    `openrouter/` 接頭辞を使用して OpenRouter 画像モデルを選択します：

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

    OpenClaw は `prompt`、`count`、参照画像、および Gemini 互換の
    `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。
    現在組み込まれている OpenRouter 画像モデルのショートカットには、
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` が
    含まれます。設定済みの Plugin が公開している項目を確認するには、
    `action: "list"` を使用します。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上の Krea 2 モデルは、Flux で使用される汎用の `image_size`
    スキーマではなく、fal ネイティブの Krea スキーマを使用します。
    OpenClaw は以下を送信します：

    - アスペクト比のヒントには `aspect_ratio`
    - `creativity`（デフォルトは `medium`）
    - `image` または `images` が指定された場合は `image_style_references`

    より高速で表現力豊かなイラストには Krea 2 Medium を、
    より低速ながら詳細な写実表現やテクスチャ表現には Krea 2 Large を選択します：

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

    現在、Krea 2 はリクエストごとに 1 枚の画像を返します。Krea では
    `aspectRatio` の使用を推奨します。OpenClaw は `size` を最も近い
    サポート対象の Krea アスペクト比にマッピングし、`resolution` を破棄せずに
    Krea では拒否します。Krea ネイティブの創造性レベルを指定する場合は、
    `fal.creativity` を使用します：

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "リソグラフ風テクスチャを使ったサイバージンのポートレート",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax のデュアル認証">
    MiniMax の画像生成は、バンドルされている両方の MiniMax
    認証経路から利用できます：

    - API キーによるセットアップでは `minimax/image-01`
    - OAuth によるセットアップでは `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    バンドルされている xAI プロバイダーは、プロンプトのみのリクエストには
    `/v1/images/generations` を使用し、`image` または `images` が存在する場合は
    `/v1/images/edits` を使用します。

    - モデル：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 枚数：最大 4
    - 参照：1 つの `image`、または最大 3 つの `images`
    - アスペクト比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 解像度：`1K`、`2K`
    - 出力：OpenClaw が管理する画像添付ファイルとして返却

    OpenClaw は、xAI ネイティブの `quality`、`mask`、`user`、および
    `auto` アスペクト比を意図的に公開していません。これらのコントロールが、
    プロバイダー横断で共有される `image_generate` コントラクトに
    存在するようになるまで公開されません。

  </Accordion>
</AccordionGroup>

## 例

<Tabs>
  <Tab title="生成（4K 横長）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw の画像生成を紹介する、すっきりしたエディトリアルポスター" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="透明な背景に置かれたシンプルな赤い丸のステッカー" outputFormat=png background=transparent
```

同等の CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "透明な背景に置かれたシンプルな赤い丸のステッカー" \
  --json
```

  </Tab>
  <Tab title="生成（OpenAI の低品質設定）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="落ち着いた生産性向上アプリ向けの低コストなポスター案" quality=low openai='{"moderation":"low"}'
```

同等の CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "落ち着いた生産性向上アプリ向けの低コストなポスター案" \
  --json
```

  </Tab>
  <Tab title="生成（正方形を2枚）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="落ち着いた生産性向上アプリのアイコンについて、2つのビジュアル案" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編集（参照画像1枚）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="被写体はそのままに、背景を明るいスタジオセットに置き換える" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編集（複数の参照画像）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="1枚目の画像のキャラクターのアイデンティティと、2枚目のカラーパレットを組み合わせる" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Kreaスタイル参照">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="このカラーパレットと印刷テクスチャを使用した、表現力豊かなエディトリアルポートレート" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

同じ`--output-format`、`--background`、`--quality`、および
`--openai-moderation`フラグを`openclaw infer image edit`でも使用できます。
`--openai-background`は引き続きOpenAI固有のエイリアスです。現在、OpenAI以外の
同梱プロバイダーは明示的な背景制御を宣言していないため、それらでは
`background: "transparent"`は無視されたものとして報告されます。

## 関連項目

- [ツールの概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [ComfyUI](/ja-JP/providers/comfy) - ローカルComfyUIとComfy Cloudのワークフロー設定
- [fal](/ja-JP/providers/fal) - fal画像・動画プロバイダーの設定
- [Google（Gemini）](/ja-JP/providers/google) - Gemini画像プロバイダーの設定
- [Microsoft Foundry Plugin](/ja-JP/plugins/reference/microsoft-foundry) - Microsoft FoundryチャットとMAI画像の設定
- [MiniMax](/ja-JP/providers/minimax) - MiniMax画像プロバイダーの設定
- [OpenAI](/ja-JP/providers/openai) - OpenAI Imagesプロバイダーの設定
- [Vydra](/ja-JP/providers/vydra) - Vydra画像・動画・音声の設定
- [xAI](/ja-JP/providers/xai) - Grok画像、動画、検索、コード実行、TTSの設定
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - `imageGenerationModel`の設定
- [モデル](/ja-JP/concepts/models) - モデルの設定とフェイルオーバー
