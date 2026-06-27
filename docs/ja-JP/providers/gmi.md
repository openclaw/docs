---
read_when:
    - GMI CloudモデルでOpenClawを実行したい
    - GMI プロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClaw で GMI Cloud の OpenAI 互換 API を使用する
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T12:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud は、OpenAI 互換 API の背後で frontier モデルと open-weight モデルを提供するホスト型推論プラットフォームです。OpenClaw では公式の外部プロバイダー Plugin であり、一度インストールして、プロバイダー id `gmi` で選択し、通常のモデル認証を通じて認証情報を保存し、`gmi/google/gemini-3.1-flash-lite` のようなモデル参照を使用します。

Google、Anthropic、OpenAI、DeepSeek、Moonshot、Z.AI など、GMI のカタログで公開されている複数のホスト型モデルファミリーに対して 1 つの API キーを使いたい場合は GMI を使用します。モデルフォールバック用のセカンダリプロバイダーとして、ベンダー間でホスト型ルートを比較するため、またはプライマリプロバイダーより先に GMI でモデルが利用可能になった場合に便利です。

このプロバイダーは OpenAI 互換のチャットセマンティクスを使用します。OpenClaw はプロバイダー id、認証プロファイル、エイリアス、モデルカタログシード、ベース URL を所有します。GMI はライブのモデル可用性、請求、レート制限、およびプロバイダー側のルーティングポリシーを所有します。

## セットアップ

Plugin をインストールし、gateway を再起動してから、GMI Cloud で API キーを作成します。

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

次に実行します。

```bash
openclaw onboard --auth-choice gmi-api-key
```

または、次を設定します。

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## デフォルト

- プロバイダー: `gmi`
- エイリアス: `gmi-cloud`, `gmicloud`
- ベース URL: `https://api.gmi-serving.com/v1`
- 環境変数: `GMI_API_KEY`
- デフォルトモデル: `gmi/google/gemini-3.1-flash-lite`

## GMI を選ぶ場合

- ローカルモデルサーバーではなく、ホスト型の OpenAI 互換エンドポイントが必要な場合。
- 1 つのプロバイダーアカウントで、複数の商用および open-weight モデルファミリーを試したい場合。
- OpenRouter、DeepInfra、Together、または直接のベンダー API とは異なるアップストリームルーティングを持つフォールバックプロバイダーが必要な場合。
- GMI 固有のモデル id、価格、またはアカウント制御が必要な場合。

GMI が OpenAI 互換ルートで公開していないベンダーネイティブ機能が必要な場合は、代わりに直接のベンダープロバイダーを選んでください。ホスト型の利便性よりもデータのローカリティやローカル GPU 制御が重要な場合は、Ollama、LM Studio、vLLM、SGLang などのローカルプロバイダーを選んでください。

## モデル

Plugin カタログは、一般に利用可能な GMI Cloud ルート id をシードします。例:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

カタログはシードであり、すべてのアカウントが常にすべてのモデルを呼び出せることを保証するものではありません。構成済みプロバイダーがお使いの環境で何を報告するかを確認するには、OpenClaw のモデル一覧コマンドを使用します。

```bash
openclaw models list --provider gmi
```

## トラブルシューティング

- `401` または `403`: OpenClaw を実行しているプロセスに `GMI_API_KEY` が設定されていることを確認するか、オンボーディングを再実行してプロバイダー認証プロファイルにキーを保存してください。
- 不明なモデルエラー: モデルが GMI アカウントに存在することを確認し、`openclaw models list --provider gmi` に表示される完全な `gmi/<route-id>` 参照を使用してください。
- 断続的なプロバイダーエラー: 別の GMI ルートを試すか、GMI を唯一のプライマリモデルプロバイダーではなくフォールバックとして構成してください。

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
