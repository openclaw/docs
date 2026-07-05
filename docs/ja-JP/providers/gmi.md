---
read_when:
    - OpenClaw を GMI Cloud モデルで実行したい
    - GMI プロバイダー ID、キー、またはエンドポイントが必要です
summary: OpenClawでGMI CloudのOpenAI互換APIを使用する
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-05T11:44:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud は、OpenAI 互換 API の背後でフロンティアモデルとオープンウェイトモデルを提供するホスト型推論プラットフォームです。OpenClaw では公式の外部プロバイダー
Plugin です。一度インストールし、通常のモデル認証を通じて認証情報を保存すると、`gmi/google/gemini-3.1-flash-lite` のようなモデル参照を使用できます。

Anthropic、DeepSeek、Google、Moonshot、OpenAI、Z.AI など、GMI のカタログで公開されているルートを含む複数のホスト型モデルファミリーに対して 1 つの API キーを使いたい場合は、GMI を使用してください。モデルフォールバック用のセカンダリプロバイダーとして、ベンダー間でホスト型ルートを比較する場合、またはプライマリプロバイダーより先に GMI でモデルが利用可能になっている場合に役立ちます。OpenClaw はプロバイダー ID、認証プロファイル、エイリアス、モデルカタログのシード、ベース URL を所有します。GMI はライブのモデル可用性、課金、レート制限、プロバイダー側のルーティングポリシーを所有します。

| プロパティ      | 値                                    |
| ------------- | ---------------------------------------- |
| プロバイダー ID   | `gmi` (エイリアス: `gmi-cloud`, `gmicloud`) |
| パッケージ       | `@openclaw/gmi-provider`                 |
| 認証環境変数  | `GMI_API_KEY`                            |
| API           | OpenAI 互換 (`openai-completions`) |
| ベース URL      | `https://api.gmi-serving.com/v1`         |
| デフォルトモデル | `gmi/google/gemini-3.1-flash-lite`       |

## セットアップ

Plugin をインストールし、Gateway を再起動してから、GMI Cloud
(`https://www.gmicloud.ai/`) で API キーを作成します。

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

次に実行します。

```bash
openclaw onboard --auth-choice gmi-api-key
```

非対話型セットアップでは `--gmi-api-key <key>` を渡すか、次を設定できます。

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## GMI を選ぶ場面

- ローカルモデルサーバーではなく、ホスト型の OpenAI 互換エンドポイントが必要な場合。
- 1 つのプロバイダーアカウントで、複数の商用モデルファミリーとオープンウェイトモデルファミリーを試したい場合。
- DeepInfra、OpenRouter、Together、または直接のベンダー API とは異なるアップストリームルーティングを持つフォールバックプロバイダーが必要な場合。
- GMI 固有のモデル ID、価格、またはアカウント制御が必要な場合。

GMI が OpenAI 互換ルートを通じて公開していないベンダーネイティブ機能が必要な場合は、代わりに直接のベンダープロバイダーを選択してください。ホスト型の利便性よりもデータローカリティやローカル GPU 制御が重要な場合は、LM Studio、Ollama、SGLang、vLLM などのローカルプロバイダーを選択してください。

## モデル

Plugin カタログは、一般的に利用可能な GMI Cloud ルート ID をシードします。

| モデル参照                          | 入力        | コンテキスト   | 最大出力 |
| ---------------------------------- | ------------ | --------- | ---------- |
| `gmi/anthropic/claude-sonnet-4.6`  | テキスト + 画像 | 200,000   | 64,000     |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | テキスト         | 163,840   | 65,536     |
| `gmi/google/gemini-3.1-flash-lite` | テキスト + 画像 | 1,048,576 | 65,536     |
| `gmi/moonshotai/Kimi-K2.5`         | テキスト + 画像 | 262,144   | 65,536     |
| `gmi/openai/gpt-5.4`               | テキスト + 画像 | 400,000   | 128,000    |
| `gmi/zai-org/GLM-5.1-FP8`          | テキスト         | 202,752   | 65,536     |

カタログはシードであり、すべてのアカウントが常にすべてのモデルを呼び出せることを約束するものではありません。設定済みプロバイダーが自分の環境で報告する内容を一覧表示してください。

```bash
openclaw models list --provider gmi
```

## トラブルシューティング

- `401` または `403`: OpenClaw を実行しているプロセスに `GMI_API_KEY` が設定されていることを確認するか、オンボーディングを再実行してプロバイダー認証プロファイルにキーを保存してください。
- 不明なモデルのエラー: そのモデルが自分の GMI アカウントに存在することを確認し、`openclaw models list --provider gmi` に表示される完全な `gmi/<route-id>` 参照を使用してください。
- 断続的なプロバイダーエラー: 別の GMI ルートを試すか、GMI を唯一のプライマリモデルプロバイダーではなくフォールバックとして設定してください。

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
