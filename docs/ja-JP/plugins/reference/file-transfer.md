---
read_when:
    - ファイル転送 Plugin のインストール、設定、または監査を行っている場合
summary: 専用の Node コマンドを使用して、ペアリング済み Node 上のファイルを取得、一覧表示、書き込みできます。最大 16 MB のバイナリには `node.invoke` 経由で base64 を使用するため、bash の標準出力の切り詰めを回避できます。
title: ファイル転送Plugin
x-i18n:
    generated_at: "2026-07-11T22:29:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# ファイル転送Plugin

専用のNodeコマンドを介して、ペアリング済みNode上のファイルを取得、一覧表示、書き込みできます。最大16 MBのバイナリでは、`node.invoke`経由でbase64を使用することで、bashの標準出力が切り詰められる問題を回避します。

## 配布

- パッケージ: `@openclaw/file-transfer`
- インストール経路: OpenClawに同梱

## 提供範囲

コントラクト: ツール
