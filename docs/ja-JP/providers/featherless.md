---
read_when:
    - OpenClaw で Featherless AI を使用する場合
    - Featherless API キーの環境変数またはモデル参照形式が必要です
summary: Featherless AI のセットアップ、モデル選択、ツール呼び出し
title: Featherless AI
x-i18n:
    generated_at: "2026-07-11T22:35:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) は、OpenAI 互換 API を通じてオープンモデルを提供します。OpenClaw は Featherless を公式の外部プロバイダー Plugin としてインストールし、組み込みカタログを小さく保ちながら、実行時に Featherless の正確なモデル ID を受け付けます。

| プロパティ               | 値                                       |
| ------------------------ | ---------------------------------------- |
| プロバイダー ID          | `featherless`                            |
| パッケージ               | `@openclaw/featherless-provider`         |
| 認証環境変数             | `FEATHERLESS_API_KEY`                    |
| オンボーディングフラグ   | `--auth-choice featherless-api-key`      |
| 直接指定する CLI フラグ  | `--featherless-api-key <key>`            |
| API                      | OpenAI 互換（`openai-completions`）      |
| ベース URL               | `https://api.featherless.ai/v1`          |
| デフォルトモデル         | `featherless/Qwen/Qwen3-32B`             |

## セットアップ

Plugin をインストールし、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

オンボーディングを実行します。

```bash
openclaw onboard --auth-choice featherless-api-key
```

非対話型セットアップの場合：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

または、Gateway プロセスにキーを公開します。

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

プロバイダーを確認します。

```bash
openclaw models list --provider featherless
```

## デフォルトモデル

Featherless が Qwen 3 ファミリーのネイティブなツール呼び出しを明記しているため、この Plugin はセットアップ時のデフォルトとして `Qwen/Qwen3-32B` を使用します。OpenClaw は、32,768 トークンのコンテキストウィンドウ、控えめな 4,096 トークンの出力上限、および Qwen チャットテンプレートの思考制御を設定します。

Featherless は複数の課金方式をサポートしており、OpenClaw はアカウント固有のプラン料金やリクエスト料金を組み込まないため、カタログのコストフィールドはゼロです。

## その他の Featherless モデル

`featherless/` プロバイダープレフィックスの後に、Featherless の正確なモデル ID を指定します。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw は意図的に Featherless の公開モデルインデックス全体を選択画面へコピーしません。このインデックスは大規模であり、すべてのテキスト、ビジョン、埋め込み、推論モデルを安全に分類するために十分な構造化された機能メタデータを提供していません。そのため、不明な ID は、4,096 トークンのコンテキストウィンドウと 1,024 トークンの出力上限を持つ、保守的なテキスト専用かつ非推論のデフォルト設定で解決されます。

モデルに異なるメタデータが必要な場合は、明示的なプロバイダーモデルエントリを追加します。

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

カスタムメタデータを追加する前に、Featherless のモデルカタログで現在のモデル提供状況と機能タグを確認してください。

## トラブルシューティング

- `401` または `403`：`FEATHERLESS_API_KEY` が Gateway プロセスから参照できることを確認するか、オンボーディングを再度実行してください。
- 不明なモデル：`featherless/` プレフィックスの後に、Featherless に記載されている大文字と小文字を区別した正確な ID を使用してください。
- ツール呼び出しがテキストとして返される：Qwen 3 など、Featherless がネイティブな関数呼び出しに対応すると明記しているモデルファミリーを選択してください。
- 管理対象の Gateway からキーを参照できない：`~/.openclaw/.env` またはサービスが読み込む別の環境ソースにキーを配置し、Gateway を再起動してください。

## 関連項目

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [すべてのプロバイダー](/ja-JP/providers/index)
- [思考モード](/ja-JP/tools/thinking)
