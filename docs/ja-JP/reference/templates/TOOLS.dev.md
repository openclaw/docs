---
read_when:
    - 開発用 Gateway テンプレートの使用
    - デフォルトの開発用エージェント ID の更新
summary: 開発エージェントツールの注記（C-3PO）
title: TOOLS.dev テンプレート
x-i18n:
    generated_at: "2026-07-11T22:41:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3259107a9252ff3d01b98608e6005387cb54a75da5db64f833c945056abd4173
    source_path: reference/templates/TOOLS.dev.md
    workflow: 16
---

# TOOLS.md - ユーザーツールのメモ（編集可能）

このファイルは、外部ツールや規則についての_あなた自身の_メモを記載するためのものです。どのツールが存在するかを定義するものではありません。OpenClaw は組み込みツールを内部で提供し、その他のツールは Skills によって追加されます。

## 例

### imsg

- iMessage/SMS を送信する場合: 送信相手と内容を記述し、送信前に確認します。
- 短いメッセージを優先し、シークレットの送信は避けます。

### sag

- テキスト読み上げ: 音声、対象のスピーカーまたは部屋、ストリーミングするかどうかを指定します。

ローカルのツールチェーンについてアシスタントに知らせたいことがほかにあれば、自由に追加してください。

## 関連項目

- [TOOLS.md テンプレート](/ja-JP/reference/templates/TOOLS)
