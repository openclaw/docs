---
read_when:
    - microsoft-foundry Plugin のインストール、設定、または監査を行っています
summary: OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-07-16T11:55:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。

## 配布

- パッケージ: `@openclaw/microsoft-foundry`
- インストール経路: OpenClaw に同梱

## サーフェス

プロバイダー: `microsoft-foundry`; コントラクト: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- 画像生成プロバイダー: `microsoft-foundry`

## 要件

- デプロイメントを含む Microsoft Foundry または Azure AI Foundry リソース。
- `AZURE_OPENAI_API_KEY` または設定済みのプロバイダー API キーによる API キー認証。
- Entra ID 認証の場合は、Azure CLI をインストールし、オンボーディングの前に `az login` を実行します。OpenClaw は `az account get-access-token` を通じて Microsoft Foundry のランタイムトークンを更新します。

## チャットモデル

Microsoft Foundry のチャットデプロイメントでは、プロバイダーモデル参照 `microsoft-foundry/<deployment-name>` を使用します。オンボーディングでは Azure CLI を使用して Foundry のリソースとデプロイメントを検出し、選択したデプロイメント名をモデル設定に書き込みます。

OpenClaw は、サポートされている OpenAI 互換チャット API に Foundry の `/openai/v1` エンドポイントを使用します。

- GPT、`o*`、`computer-use-preview`、および DeepSeek-V4 モデルファミリーでは、デフォルトで `openai-responses` を使用します。
- 明示的にサポート対象の API が設定されていない限り、MAI-DS-R1 およびその他のチャット補完デプロイメントでは `openai-completions` を使用します。
- MAI-DS-R1 は、`reasoning_effort` ではなく、推論コンテンツを通じて推論対応として記録されます。そのコンテキストおよび出力トークンのメタデータは 163,840 トークンです。

Microsoft Foundry の Anthropic Claude デプロイメントでは、OpenAI 互換の `/openai/v1` 形式ではなく、Anthropic Messages API 形式を使用します。Microsoft Foundry Plugin がネイティブの Anthropic ランタイムに対応するまでは、これらをカスタム `anthropic-messages` プロバイダーとして設定してください。Foundry のデプロイメント名が Claude のモデル ID と異なる場合は、モデルエントリに `params.canonicalModelId` を設定します。これにより、OpenClaw はモデル固有のワイヤーコントラクトを適用し、`/think off` を正しくマッピングして、署名付き思考を安全に保持できます。

## MAI 画像生成

この Plugin は、現在の Microsoft AI 画像モデルとともに、`image_generate` 用の `microsoft-foundry` を登録します。

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

デプロイ済みの MAI 画像デプロイメント名をモデル参照として使用します。MAI API ではリクエストの `model` フィールドにデプロイメント名が必要なため、このプロバイダーはデフォルトの画像モデルを宣言しません。

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

プロンプトのみの生成では、Microsoft Foundry の MAI 生成エンドポイント `/mai/v1/images/generations` を呼び出します。参照画像の編集では `/mai/v1/images/edits` を呼び出し、`MAI-Image-2.5-Flash` および `MAI-Image-2.5` のデプロイメントに限定されます。

プロンプトのみの生成では、Foundry エンドポイントを設定するだけで、カスタムデプロイメント名を使用できます。カスタムデプロイメント名で画像を編集する場合は、オンボーディングでデプロイメントを選択するか、OpenClaw がそのデプロイメントの基盤が `MAI-Image-2.5-Flash` または `MAI-Image-2.5` であることを検証できるように、モデルメタデータを含めます。

MAI の画像制約:

- 出力: リクエストごとに PNG 画像 1 枚。
- サイズ: デフォルトは `1024x1024`。幅と高さはいずれも 768 px 以上である必要があります。
- 総ピクセル数: 幅 × 高さは 1,048,576 以下である必要があります。
- 編集: PNG または JPEG の入力画像 1 枚。
- `aspectRatio`、`resolution`、`quality`、`background`、PNG 以外の `outputFormat` など、サポートされていない共通ヒントは Microsoft Foundry に送信されません。

## トラブルシューティング

- `az: command not found`: Azure CLI をインストールするか、API キー認証を使用します。
- `Microsoft Foundry endpoint missing for MAI image generation`: オンボーディングで Foundry デプロイメントを選択するか、`models.providers.microsoft-foundry.baseUrl` を追加します。
- `supports MAI image deployments only`: 選択した画像モデルが MAI 以外のデプロイメントを参照しています。`image_generate` には、デプロイ済みの MAI 画像モデルを使用してください。

<!-- openclaw-plugin-reference:manual-end -->
