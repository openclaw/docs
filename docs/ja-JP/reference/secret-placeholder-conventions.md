---
read_when:
    - 認証トークン、API キー、または認証情報スニペットを含むドキュメントの作成
    - シークレット検出ツールによってスキャンされる可能性がある例を更新する
summary: docs と例のシークレットスキャナー安全なプレースホルダー規約
title: シークレットプレースホルダーの規約
x-i18n:
    generated_at: "2026-07-05T11:48:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# シークレットのプレースホルダー規則

人が読めるが、実際のシークレットに似ていないプレースホルダーを使用します。

## 推奨スタイル

- `example-openai-key-not-real` や `example-discord-bot-token` のような説明的な値を優先します。
- シェルスニペットでは、インラインのトークン風文字列より `${OPENAI_API_KEY}` を優先します。
- 例は明らかに偽物で、用途（プロバイダー、チャンネル、認証タイプ）に限定します。

## docs で避けるパターン

- PEM 秘密鍵のヘッダーまたはフッターのリテラルテキスト。
- 実際の認証情報に似たプレフィックス（例: `sk-...`、`xoxb-...`、`AKIA...`）。
- ランタイムログからコピーされた、本物らしく見えるベアラートークン。

## 例

```bash
# 良い
export OPENAI_API_KEY="example-openai-key-not-real"

# より良い（ドキュメントが env 配線についての場合）
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
