---
read_when:
    - dev Gatewayテンプレートの使用
    - デフォルトdev agent identityの更新
summary: 開発agentツール注記（C-3PO）
title: TOOLS.devテンプレート
x-i18n:
    generated_at: "2026-04-24T05:20:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23c11e2832ed0dcf9ddd43e5472e0c025c1a91a33299019c16f00a7230e8e99c
    source_path: reference/templates/TOOLS.dev.md
    workflow: 15
---

# TOOLS.md - ユーザーツール注記（編集可能）

このファイルは、外部ツールや慣習についての_あなた自身の_注記を書くためのものです。
どのtoolが存在するかを定義するものではありません。OpenClawは組み込みtoolを内部的に提供します。

## 例

### imsg

- iMessage/SMSを送信する: 誰に何を送るかを説明し、送信前に確認する。
- 短いメッセージを優先し、secretの送信は避ける。

### sag

- Text-to-speech: voice、対象のspeaker/room、streamするかどうかを指定する。

assistantにあなたのローカルtoolchainについて知っておいてほしいことを、ほかにも自由に追加してください。

## 関連

- [TOOLS.md template](/ja-JP/reference/templates/TOOLS)
