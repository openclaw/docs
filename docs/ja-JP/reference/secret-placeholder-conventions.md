---
read_when:
    - トークン、API キー、または認証情報のスニペットを含むドキュメントの作成
    - シークレット検出ツールによってスキャンされる可能性がある例の更新
summary: ドキュメントと例で使用するシークレットスキャナーに検出されないプレースホルダーの規則
title: シークレット用プレースホルダーの規則
x-i18n:
    generated_at: "2026-07-11T22:41:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# シークレットのプレースホルダー規則

人が読んで理解しやすく、実際のシークレットには見えないプレースホルダーを使用してください。

## 推奨スタイル

- `example-openai-key-not-real` や `example-discord-bot-token` のような、内容が分かる値を推奨します。
- シェルスニペットでは、トークンのような文字列を直接記述せず、`${OPENAI_API_KEY}` を推奨します。
- 例は明らかに偽物と分かるものにし、用途（プロバイダー、チャンネル、認証タイプ）を明確に限定してください。

## ドキュメントで避けるべきパターン

- PEM 秘密鍵のヘッダーまたはフッターのリテラルテキスト。
- `sk-...`、`xoxb-...`、`AKIA...` など、実際の認証情報に似たプレフィックス。
- ランタイムログからコピーした、実物らしく見えるベアラートークン。

## 例

```bash
# 良い例
export OPENAI_API_KEY="example-openai-key-not-real"

# より良い例（ドキュメントが環境変数の接続方法を扱う場合）
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
