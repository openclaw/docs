---
read_when:
    - ファイル転送Pluginをインストール、設定、または監査している
summary: 専用のノードコマンドを介して、ペアリング済みノード上のファイルを取得、一覧表示、書き込みします。最大 16 MB のバイナリには node.invoke 経由で base64 を使用することで、bash の標準出力の切り詰めを回避します。
title: ファイル転送 Plugin
x-i18n:
    generated_at: "2026-05-02T20:57:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# File Transfer Plugin

ペアリングされたノード上のファイルを、専用のノードコマンドで取得、一覧表示、書き込みします。最大 16 MB のバイナリに対して `node.invoke` 経由で base64 を使用し、bash の stdout 切り詰めを回避します。

## 配布

- パッケージ: `@openclaw/file-transfer`
- インストール経路: OpenClaw に含まれる

## サーフェス

contracts: tools
