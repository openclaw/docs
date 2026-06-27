---
read_when:
    - OpenClawでCohereを使用したい
    - Cohere API キー環境変数または CLI 認証の選択が必要です
summary: Cohere のセットアップ（認証 + モデル選択）
title: Cohere
x-i18n:
    generated_at: "2026-06-27T12:41:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) は、Compatibility API を通じて OpenAI 互換の推論を提供します。OpenClaw は外部化移行中に Cohere プロバイダーを同梱し、Command A モデルカタログを備えた公式の外部 Plugin としても公開しています。

| プロパティ        | 値                                                |
| --------------- | ---------------------------------------------------- |
| プロバイダー ID     | `cohere`                                             |
| Plugin          | 移行中は同梱、公式の外部パッケージ |
| 認証 env var    | `COHERE_API_KEY`                                     |
| オンボーディングフラグ | `--auth-choice cohere-api-key`                       |
| 直接 CLI フラグ | `--cohere-api-key <key>`                             |
| API             | OpenAI 互換 (`openai-completions`)             |
| ベース URL        | `https://api.cohere.ai/compatibility/v1`             |
| デフォルトモデル   | `cohere/command-a-03-2025`                           |

## はじめる

1. Cohere は現在の OpenClaw パッケージに含まれています。利用できない場合は、外部パッケージをインストールして Gateway を再起動します。

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

デフォルトモデルは、プライマリモデルがまだ設定されていない場合にのみ設定されます。

## 環境変数のみのセットアップ

`COHERE_API_KEY` を Gateway プロセスで利用可能にしてから、Cohere モデルを選択します。

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
Gateway がデーモンまたは Docker で実行されている場合は、そのサービス向けに `COHERE_API_KEY` を設定します。インタラクティブシェル内でのみエクスポートしても、すでに実行中の Gateway では利用可能になりません。
</Note>

## 関連

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [モデル CLI](/ja-JP/cli/models)
- [プロバイダーディレクトリ](/ja-JP/providers)
