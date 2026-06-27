---
read_when:
    - トークン、API キー、または認証情報スニペットを含むドキュメントを書く
    - シークレット検出ツールでスキャンされる可能性がある例の更新
summary: Secret-scanner セーフな docs と examples 用プレースホルダー規約
title: シークレットプレースホルダーの規則
x-i18n:
    generated_at: "2026-06-27T13:01:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# シークレットプレースホルダーの規約

実際のシークレットに見えない、人間が読めるプレースホルダーを使用します。

## 推奨スタイル

- `example-openai-key-not-real` や `example-discord-bot-token` のような説明的な値を優先します。
- シェルスニペットでは、インラインのトークン風文字列よりも `${OPENAI_API_KEY}` を優先します。
- 例は明らかに偽物で、目的（プロバイダー、チャンネル、認証タイプ）に限定します。

## ドキュメントで避けるべきパターン

- PEM 秘密鍵のヘッダーまたはフッターのリテラルテキスト。
- `sk-...`、`xoxb-...`、`AKIA...` など、実際の認証情報に似たプレフィックス。
- ランタイムログからコピーされた、本物らしく見えるベアラートークン。

## 例

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
