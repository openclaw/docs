---
read_when:
    - microsoft-foundry Pluginをインストール、設定、または監査しています
summary: OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。
title: Microsoft Foundry Plugin
x-i18n:
    generated_at: "2026-07-11T22:29:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

OpenClaw に Microsoft Foundry モデルプロバイダーのサポートを追加します。

## 配布

- パッケージ: `@openclaw/microsoft-foundry`
- インストール方法: OpenClaw に同梱

## 対応範囲

プロバイダー: microsoft-foundry、コントラクト: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- 画像生成プロバイダー: `microsoft-foundry`

## 要件

- デプロイを含む Microsoft Foundry または Azure AI Foundry リソース。
- `AZURE_OPENAI_API_KEY` または設定済みのプロバイダー API キーによる API キー認証。
- Entra ID 認証を使用する場合は、オンボーディングの前に Azure CLI をインストールし、`az login` を実行します。OpenClaw は `az account get-access-token` を使用して Microsoft Foundry のランタイムトークンを更新します。

## チャットモデル

Microsoft Foundry のチャットデプロイでは、プロバイダーモデル参照 `microsoft-foundry/<deployment-name>` を使用します。オンボーディングでは Azure CLI を使用して Foundry のリソースとデプロイを検出し、選択したデプロイ名をモデル設定に書き込みます。

OpenClaw は、サポートされている OpenAI 互換チャット API に Foundry の `/openai/v1` エンドポイントを使用します。

- GPT、`o*`、`computer-use-preview`、および DeepSeek-V4 モデルファミリーのデフォルトは `openai-responses` です。
- MAI-DS-R1 およびその他のチャット補完デプロイでは、サポートされている API が明示的に設定されていない限り、`openai-completions` を使用します。
- MAI-DS-R1 は、`reasoning_effort` ではなく推論コンテンツによって推論対応として記録されます。コンテキストおよび出力トークンのメタデータは 163,840 トークンです。

Microsoft Foundry の Anthropic Claude デプロイでは、OpenAI 互換の `/openai/v1` 形式ではなく、Anthropic Messages API 形式を使用します。Microsoft Foundry Plugin にネイティブの Anthropic ランタイムが追加されるまでは、カスタム `anthropic-messages` プロバイダーとして設定してください。Foundry のデプロイ名が Claude モデル ID と異なる場合は、モデルエントリに `params.canonicalModelId` を設定します。これにより、OpenClaw はモデル固有の通信コントラクトを適用し、`/think off` を正しくマッピングして、署名付き思考を安全に保持できます。

## MAI 画像生成

この Plugin は、現在の Microsoft AI 画像モデル向けに `image_generate` の `microsoft-foundry` を登録します。

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

デプロイ済みの MAI 画像デプロイ名をモデル参照として使用します。MAI API ではリクエストの `model` フィールドにデプロイ名が必要なため、このプロバイダーはデフォルトの画像モデルを宣言しません。

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

プロンプトのみの生成では、Microsoft Foundry の MAI 生成エンドポイント `/mai/v1/images/generations` を呼び出します。参照画像の編集では `/mai/v1/images/edits` を呼び出し、`MAI-Image-2.5-Flash` および `MAI-Image-2.5` のデプロイに限定されます。

プロンプトのみの生成では、Foundry エンドポイントを設定するだけで、カスタムデプロイ名を使用できます。カスタムデプロイ名で画像を編集する場合は、オンボーディングでデプロイを選択するか、モデルメタデータを含めて、そのデプロイが `MAI-Image-2.5-Flash` または `MAI-Image-2.5` を基盤としていることを OpenClaw が検証できるようにします。

MAI 画像の制約:

- 出力: リクエストごとに PNG 画像 1 枚。
- サイズ: デフォルトは `1024x1024`。幅と高さはどちらも 768 px 以上である必要があります。
- 総ピクセル数: 幅 × 高さは 1,048,576 以下である必要があります。
- 編集: PNG または JPEG の入力画像 1 枚。
- `aspectRatio`、`resolution`、`quality`、`background`、PNG 以外の `outputFormat` など、サポートされていない共通ヒントは Microsoft Foundry に送信されません。

## トラブルシューティング

- `az: command not found`: Azure CLI をインストールするか、API キー認証を使用してください。
- `Microsoft Foundry endpoint missing for MAI image generation`: オンボーディングで Foundry デプロイを選択するか、`models.providers.microsoft-foundry.baseUrl` を追加してください。
- `supports MAI image deployments only`: 選択した画像モデルが MAI 以外のデプロイを指しています。`image_generate` には、デプロイ済みの MAI 画像モデルを使用してください。

<!-- openclaw-plugin-reference:manual-end -->
