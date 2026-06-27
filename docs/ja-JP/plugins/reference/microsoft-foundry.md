---
read_when:
    - microsoft-foundry pluginをインストール、設定、または監査しています
summary: OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-06-27T12:26:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw に Microsoft Foundry モデルプロバイダー対応を追加します。

## 配布

- パッケージ: `@openclaw/microsoft-foundry`
- インストール経路: OpenClaw に含まれます

## サーフェス

プロバイダー: microsoft-foundry; コントラクト: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- 画像生成プロバイダー: `microsoft-foundry`

## 要件

- デプロイを持つ Microsoft Foundry または Azure AI Foundry リソース。
- `AZURE_OPENAI_API_KEY` または設定済みのプロバイダー API キーによる API キー認証。
- Entra ID 認証では、オンボーディングの前に Azure CLI をインストールし、
  `az login` を実行します。OpenClaw は Microsoft Foundry ランタイムトークンを
  `az account get-access-token` で更新します。

## チャットモデル

Microsoft Foundry チャットデプロイはプロバイダーモデル参照
`microsoft-foundry/<deployment-name>` を使用します。オンボーディングは Azure CLI で Foundry リソース
とデプロイを検出し、選択したデプロイ名をモデル設定に書き込みます。

OpenClaw は、対応している OpenAI 互換チャット API に Foundry `/openai/v1` エンドポイントを使用します。

- GPT、`o*`、`computer-use-preview`、DeepSeek-V4 モデルファミリーは既定で
  `openai-responses` になります。
- MAI-DS-R1 とその他のチャット補完デプロイは、明示的に対応 API が設定されていない限り
  `openai-completions` を使用します。
- MAI-DS-R1 は `reasoning_effort` ではなく、reasoning content によって推論対応として記録されます。そのコンテキストと出力トークンのメタデータは
  163,840 トークンです。

Microsoft Foundry の Anthropic Claude デプロイは、OpenAI 互換の `/openai/v1` 形式ではなく、Anthropic Messages
API 形式を使用します。Microsoft Foundry Plugin にネイティブ Anthropic ランタイムが追加されるまでは、これらをカスタム
`anthropic-messages` プロバイダーとして設定してください。Foundry デプロイ名が
Claude モデル ID と異なる場合は、モデルエントリに `params.canonicalModelId` を設定し、OpenClaw が
モデル固有のワイヤーコントラクトを適用し、`/think off` を正しくマッピングし、signed thinking を安全に保持できるようにします。

## MAI 画像生成

この Plugin は、現在の Microsoft AI 画像モデルで `image_generate` 用に `microsoft-foundry` を登録します。

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

デプロイ済みの MAI 画像デプロイ名をモデル参照として使用します。このプロバイダーは既定の画像モデルを宣言しません。これは、MAI API がリクエストの
`model` フィールドにデプロイ名を要求するためです。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

プロンプトのみの生成呼び出しは、Microsoft Foundry の MAI generations エンドポイント
`/mai/v1/images/generations` を呼び出します。参照画像の編集は
`/mai/v1/images/edits` を呼び出し、`MAI-Image-2.5-Flash` と
`MAI-Image-2.5` のデプロイに制限されます。

プロンプトのみの生成では、Foundry エンドポイントだけを設定してカスタムデプロイ名を使用できます。カスタムデプロイ名で画像編集を行う場合は、オンボーディングでそのデプロイを選択するか、OpenClaw がそのデプロイが
`MAI-Image-2.5-Flash` または `MAI-Image-2.5` に基づくことを検証できるようにモデルメタデータを含めてください。

MAI 画像の制約:

- 出力: リクエストごとに PNG 画像 1 枚。
- サイズ: 既定は `1024x1024`。幅と高さはいずれも 768 px 以上である必要があります。
- 総ピクセル数: 幅 × 高さは最大 1,048,576 である必要があります。
- 編集: PNG または JPEG 入力画像 1 枚。
- `aspectRatio`、`resolution`、`quality`、
  `background`、非 PNG の `outputFormat` など、対応していない共有ヒントは Microsoft Foundry に送信されません。

## トラブルシューティング

- `az: command not found`: Azure CLI をインストールするか、API キー認証を使用してください。
- `Microsoft Foundry endpoint missing for MAI image generation`: オンボーディングで
  Foundry デプロイを選択するか、`models.providers.microsoft-foundry.baseUrl` を追加してください。
- `supports MAI image deployments only`: 選択された画像モデルは
  非 MAI デプロイを指しています。`image_generate` にはデプロイ済みの MAI 画像モデルを使用してください。

<!-- openclaw-plugin-reference:manual-end -->
