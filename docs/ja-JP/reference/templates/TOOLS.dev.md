---
read_when:
    - 開発用 Gateway テンプレートの使用
    - デフォルトの開発エージェント ID の更新
summary: Dev エージェントツールのメモ (C-3PO)
title: TOOLS.dev テンプレート
x-i18n:
    generated_at: "2026-07-05T11:50:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3259107a9252ff3d01b98608e6005387cb54a75da5db64f833c945056abd4173
    source_path: reference/templates/TOOLS.dev.md
    workflow: 16
---

# TOOLS.md - ユーザーツールメモ（編集可能）

このファイルは、外部ツールと慣例に関する _あなたの_ メモ用です。どのツールが存在するかは定義しません。OpenClaw は組み込みツールを内部で提供し、Skills が残りを追加します。

## 例

### imsg

- iMessage/SMS を送信する: 誰に/何を送るかを記述し、送信前に確認する。
- 短いメッセージを優先し、秘密情報の送信は避ける。

### sag

- テキスト読み上げ: 音声、対象のスピーカー/部屋、ストリーミングするかどうかを指定する。

ローカルのツールチェーンについて、アシスタントに知っておいてほしいことを自由に追加してください。

## 関連

- [TOOLS.md テンプレート](/ja-JP/reference/templates/TOOLS)
