---
read_when:
    - ファイル転送Pluginをインストール、設定、または監査しています
summary: 専用の Node コマンドを介して、ペアリング済み Node 上のファイルを取得、一覧表示、書き込みできます。最大 16 MB のバイナリには `node.invoke` 経由の base64 を使用することで、bash の標準出力の切り捨てを回避します。
title: ファイル転送Plugin
x-i18n:
    generated_at: "2026-07-16T11:54:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# ファイル転送Plugin

専用のNodeコマンドを介して、ペアリング済みNode上のファイルを取得、一覧表示、書き込みできます。最大16 MBのバイナリに対してnode.invoke経由でbase64を使用することで、bashの標準出力の切り捨てを回避します。

## 配布

- パッケージ: `@openclaw/file-transfer`
- インストール方法: OpenClawに同梱

## サーフェス

コントラクト: `tools`
