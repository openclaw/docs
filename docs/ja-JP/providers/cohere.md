---
read_when:
    - OpenClaw で Cohere を使用する場合
    - Cohere API キーの環境変数または CLI 認証の選択が必要です
summary: Cohere のセットアップ（認証 + モデル選択）
title: Cohere
x-i18n:
    generated_at: "2026-07-11T22:36:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) は、Compatibility API を通じて OpenAI 互換の推論を提供します。OpenClaw は、Cohere プロバイダーの外部化移行期間中、このプロバイダーを同梱するとともに、公式の外部 Plugin としても公開しています。

| プロパティ           | 値                                           |
| -------------------- | -------------------------------------------- |
| プロバイダー ID      | `cohere`                                     |
| Plugin               | 移行期間中は同梱、公式の外部パッケージ       |
| 認証環境変数         | `COHERE_API_KEY`                             |
| オンボーディングフラグ | `--auth-choice cohere-api-key`               |
| 直接指定する CLI フラグ | `--cohere-api-key <key>`                     |
| API                  | OpenAI 互換（`openai-completions`）          |
| ベース URL           | `https://api.cohere.ai/compatibility/v1`     |
| デフォルトモデル     | `cohere/command-a-plus-05-2026`              |
| コンテキストウィンドウ | 128,000 トークン                             |

## 組み込みカタログ

| モデル参照                           | 入力               | コンテキスト | 最大出力 | 備考                                             |
| ------------------------------------ | ------------------ | ------------ | -------- | ------------------------------------------------ |
| `cohere/command-a-plus-05-2026`      | テキスト、画像     | 128,000      | 64,000   | デフォルト。主力のエージェント型・推論モデル     |
| `cohere/command-a-03-2025`           | テキスト           | 256,000      | 8,000    | 以前の Command A モデル                          |
| `cohere/command-a-reasoning-08-2025` | テキスト           | 256,000      | 32,000   | エージェント型推論とツール使用                   |
| `cohere/command-a-vision-07-2025`    | テキスト、画像     | 128,000      | 8,000    | 画像・文書分析。ツール使用には非対応             |
| `cohere/north-mini-code-1-0`         | テキスト、画像     | 256,000      | 64,000   | エージェント型コーディング、推論、無料枠あり     |

推論対応の Cohere モデルは、2 つの Compatibility API 推論モードをサポートしています。OpenClaw は **無効** を `none` に、すべての有効な思考レベルを `high` に対応付けます。Command A Vision はツール使用をサポートしていないため、OpenClaw はこのモデルでエージェントツールを無効のままにします。

## はじめに

1. 現在の OpenClaw パッケージには Cohere が同梱されています。存在しない場合は、外部パッケージをインストールして Gateway を再起動します。

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

プライマリモデルがまだ設定されていない場合に限り、オンボーディングによって Cohere がプライマリモデルとして設定されます。

## 環境変数のみを使用したセットアップ

`COHERE_API_KEY` を Gateway プロセスから利用可能にしてから、Cohere モデルを選択します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Gateway をデーモンまたは Docker で実行する場合は、そのサービスに `COHERE_API_KEY` を設定してください。対話型シェルでエクスポートするだけでは、すでに実行中の Gateway からは利用できません。
</Note>

## 関連項目

- [モデルプロバイダー](/ja-JP/concepts/model-providers)
- [モデル CLI](/ja-JP/cli/models)
- [プロバイダーディレクトリ](/ja-JP/providers/index)
