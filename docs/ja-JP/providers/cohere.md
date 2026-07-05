---
read_when:
    - OpenClaw で Cohere を使用したい
    - Cohere API キーの環境変数または CLI 認証の選択が必要です
summary: Cohere のセットアップ（認証 + モデル選択）
title: Cohere
x-i18n:
    generated_at: "2026-07-05T11:39:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 846e69fd185c210c9ffd8719a233272aeda2aa0749f952a74714c13fd917fb66
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) は Compatibility API を通じて OpenAI 互換の推論を提供します。OpenClaw は外部化への移行期間中、Cohere プロバイダーを同梱し、公式外部プラグインとしても公開しています。

| プロパティ        | 値                                                |
| --------------- | ---------------------------------------------------- |
| プロバイダー ID     | `cohere`                                             |
| Plugin          | 移行期間中は同梱、公式外部パッケージ |
| 認証環境変数    | `COHERE_API_KEY`                                     |
| オンボーディングフラグ | `--auth-choice cohere-api-key`                       |
| 直接 CLI フラグ | `--cohere-api-key <key>`                             |
| API             | OpenAI 互換 (`openai-completions`)             |
| ベース URL        | `https://api.cohere.ai/compatibility/v1`             |
| デフォルトモデル   | `cohere/command-a-03-2025`                           |
| コンテキストウィンドウ  | 256,000 トークン                                       |

## はじめる

1. Cohere は現在の OpenClaw パッケージに同梱されています。見つからない場合は、外部パッケージをインストールして Gateway を再起動します。

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Cohere API キーを作成します。
3. オンボーディングを実行します。

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. カタログが利用可能であることを確認します。

```bash
openclaw models list --provider cohere
```

オンボーディングでは、プライマリモデルがまだ設定されていない場合にのみ、Cohere をプライマリモデルとして設定します。

## 環境変数のみのセットアップ

`COHERE_API_KEY` を Gateway プロセスで利用できるようにしてから、Cohere モデルを選択します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Gateway がデーモンまたは Docker で実行されている場合は、そのサービスに `COHERE_API_KEY` を設定してください。インタラクティブシェルでのみエクスポートしても、すでに実行中の Gateway では利用できません。
</Note>

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [Models CLI](/ja-JP/cli/models)
- [プロバイダーディレクトリ](/ja-JP/providers/index)
