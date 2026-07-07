---
read_when:
    - OpenClaw で LongCat-2.0 を使用したい場合
    - LongCat APIキーまたはモデル制限が必要です
summary: LongCat-2.0 用 LongCat API セットアップ
title: LongCat
x-i18n:
    generated_at: "2026-07-06T21:53:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) は LongCat-2.0 向けのホスト型 API を提供しています。これは、コーディングとエージェント的なワークロード向けに構築された推論モデルです。OpenClaw は、LongCat の OpenAI 互換エンドポイント向けに公式の `longcat` Pluginを提供しています。

| プロパティ | 値 |
| ---------- | ---------------------------------- |
| プロバイダー | `longcat`                          |
| 認証       | `LONGCAT_API_KEY`                  |
| API        | OpenAI互換 Chat Completions |
| ベース URL | `https://api.longcat.chat/openai`  |
| モデル     | `longcat/LongCat-2.0`              |
| コンテキスト | 1,048,576 トークン                   |
| 最大出力 | 131,072 トークン                     |
| 入力      | テキスト                               |

## Pluginをインストール

公式パッケージをインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを作成する">
    [LongCat API Platform](https://longcat.chat/platform/) にサインインし、
    [API Keys](https://longcat.chat/platform/api_keys)
    ページでキーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="モデルを確認する">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

オンボーディングはホスト型カタログを追加し、プライマリモデルがまだ構成されていない場合は `longcat/LongCat-2.0` を選択します。

### 非対話型セットアップ

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## 推論の動作

LongCat はバイナリの thinking 制御を公開しています。OpenClaw は有効な thinking レベルを
`thinking: { type: "enabled" }` に、`/think off` を
`thinking: { type: "disabled" }` にマップします。LongCat は現在
`reasoning_effort` を文書化していないため、OpenClaw はそれを送信しません。

LongCat は推論を `reasoning_content` で返します。OpenClaw は、アシスタントのツール呼び出しターンを再生するときにそのフィールドを保持するため、複数ターンのエージェントセッションでもプロバイダーが期待するメッセージ形状が維持されます。

## 料金

組み込みカタログでは、LongCat の従量課金リスト価格を 100 万トークンあたりの USD で使用します。未キャッシュ入力は $0.75、キャッシュ済み入力は $0.015、出力は $2.95 です。LongCat は一時的な割引を提供する場合があります。[料金ページ](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
と請求記録が正確な情報源です。

## セルフホスト型 LongCat-2.0

`longcat` プロバイダーは LongCat のホスト型 API を対象としています。
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0) のオープンウェイトについては、OpenAI互換ランタイムでモデルを提供し、代わりに OpenClaw の既存の
[vLLM](/ja-JP/providers/vllm) または [SGLang](/ja-JP/providers/sglang) プロバイダーを使用してください。

セルフホスト型プロバイダーカタログには、ランタイムの正確なモデル識別子を保持してください。
ローカルデプロイメントを `longcat/LongCat-2.0` 経由でルーティングしないでください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="キーはシェルでは動作するが Gateway では動作しない">
    デーモン管理の Gateway プロセスは、対話型シェルのすべての変数を継承するわけではありません。
    `LONGCAT_API_KEY` を `~/.openclaw/.env` に入れるか、オンボーディングで構成するか、承認済みのシークレット参照を使用してください。
  </Accordion>

  <Accordion title="リクエストが 402 または 429 で失敗する">
    `402` はアカウントのトークンクォータが不足していることを意味します。`429` は API
    キーがレート制限に達したことを意味します。[LongCat usage](https://longcat.chat/platform/usage)
    を確認し、プロバイダーのバックオフ期間後にレート制限されたリクエストを再試行してください。
  </Accordion>

  <Accordion title="モデルが表示されない">
    `openclaw plugins list` を実行して `longcat` Pluginが有効であることを確認し、
    その後 `openclaw models list --provider longcat` を実行してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー構成、モデル参照、フェイルオーバー動作。
  </Card>
  <Card title="LongCat API ドキュメント" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    ホスト型 API エンドポイント、認証、制限、例。
  </Card>
  <Card title="LongCat-2.0 モデルカード" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    アーキテクチャ、デプロイメントガイダンス、モデルの詳細。
  </Card>
  <Card title="シークレット" href="/ja-JP/gateway/secrets" icon="key">
    設定に平文を埋め込まずに、プロバイダー認証情報を保存します。
  </Card>
</CardGroup>
