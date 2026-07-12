---
read_when:
    - GMI CloudモデルでOpenClawを実行する場合
    - GMI のプロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClawでGMI CloudのOpenAI互換APIを使用する
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-11T22:35:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud は、OpenAI 互換 API を介してフロンティアモデルとオープンウェイトモデルを提供するホステッド推論プラットフォームです。OpenClaw では公式の外部プロバイダー Plugin として提供されます。一度インストールし、通常のモデル認証を通じて認証情報を保存すると、`gmi/google/gemini-3.1-flash-lite` のようなモデル参照を使用できます。

GMI は、GMI のカタログで公開されている Anthropic、DeepSeek、Google、Moonshot、OpenAI、Z.AI のルートを含む、複数のホステッドモデルファミリーを 1 つの API キーで利用したい場合に適しています。モデルのフォールバック用のセカンダリプロバイダー、ベンダー間でホステッドルートを比較するためのプロバイダー、またはプライマリプロバイダーより先に GMI でモデルが利用可能になった場合のプロバイダーとして使用できます。OpenClaw はプロバイダー ID、認証プロファイル、エイリアス、モデルカタログのシード、ベース URL を管理します。GMI はリアルタイムのモデル提供状況、請求、レート制限、およびプロバイダー側のルーティングポリシーを管理します。

| プロパティ      | 値                                       |
| ------------- | ---------------------------------------- |
| プロバイダー ID | `gmi`（エイリアス: `gmi-cloud`、`gmicloud`） |
| パッケージ      | `@openclaw/gmi-provider`                 |
| 認証環境変数    | `GMI_API_KEY`                            |
| API           | OpenAI 互換（`openai-completions`）       |
| ベース URL     | `https://api.gmi-serving.com/v1`         |
| デフォルトモデル | `gmi/google/gemini-3.1-flash-lite`       |

## セットアップ

Plugin をインストールして Gateway を再起動し、GMI Cloud（`https://www.gmicloud.ai/`）で API キーを作成します。

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

次に、以下を実行します。

```bash
openclaw onboard --auth-choice gmi-api-key
```

非対話型セットアップでは `--gmi-api-key <key>` を渡すか、次のように設定できます。

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## GMI を選ぶ場合

- ローカルモデルサーバーではなく、ホステッド OpenAI 互換エンドポイントを使用したい場合。
- 1 つのプロバイダーアカウントを通じて、複数の商用モデルファミリーとオープンウェイトモデルファミリーを試したい場合。
- DeepInfra、OpenRouter、Together、またはベンダーの直接 API とは異なるアップストリームルーティングを持つフォールバックプロバイダーが必要な場合。
- GMI 固有のモデル ID、料金体系、またはアカウント管理機能が必要な場合。

GMI が OpenAI 互換ルートを通じて公開していないベンダーネイティブ機能が必要な場合は、代わりにベンダーの直接プロバイダーを選択してください。ホステッドサービスの利便性よりもデータの局所性やローカル GPU の制御が重要な場合は、LM Studio、Ollama、SGLang、vLLM などのローカルプロバイダーを選択してください。

## モデル

Plugin カタログには、一般に利用可能な GMI Cloud のルート ID がシードとして含まれています。

| モデル参照                           | 入力             | コンテキスト | 最大出力 |
| ---------------------------------- | ---------------- | --------- | ------- |
| `gmi/anthropic/claude-sonnet-4.6`  | テキスト + 画像   | 200,000   | 64,000  |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | テキスト          | 163,840   | 65,536  |
| `gmi/google/gemini-3.1-flash-lite` | テキスト + 画像   | 1,048,576 | 65,536  |
| `gmi/moonshotai/Kimi-K2.5`         | テキスト + 画像   | 262,144   | 65,536  |
| `gmi/openai/gpt-5.4`               | テキスト + 画像   | 400,000   | 128,000 |
| `gmi/zai-org/GLM-5.1-FP8`          | テキスト          | 202,752   | 65,536  |

このカタログはシードであり、すべてのアカウントが常にすべてのモデルを呼び出せることを保証するものではありません。お使いの環境で、設定済みプロバイダーから報告されるモデルを一覧表示してください。

```bash
openclaw models list --provider gmi
```

## トラブルシューティング

- `401` または `403`: OpenClaw を実行しているプロセスに `GMI_API_KEY` が設定されていることを確認するか、オンボーディングを再実行してプロバイダーの認証プロファイルにキーを保存してください。
- 不明なモデルのエラー: モデルがお使いの GMI アカウントに存在することを確認し、`openclaw models list --provider gmi` に表示される完全な `gmi/<route-id>` 参照を使用してください。
- 断続的なプロバイダーエラー: 別の GMI ルートを試すか、GMI を唯一のプライマリモデルプロバイダーとしてではなく、フォールバックとして設定してください。

## 関連項目

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
