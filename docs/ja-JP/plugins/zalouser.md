---
read_when:
    - OpenClaw で Zalo Personal（非公式）サポートを使いたい場合
    - '`zalouser` Plugin を設定または開発している場合'
summary: 'Zalo Personal Plugin: ネイティブ `zca-js` 経由の QR ログイン + メッセージング（Plugin インストール + チャネル設定 + ツール）'
title: Zalo Personal Plugin
x-i18n:
    generated_at: "2026-04-24T05:13:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal（Plugin）

ネイティブ `zca-js` を使って通常の Zalo 個人アカウントを自動化する、OpenClaw 向け Zalo Personal サポート用 Plugin です。

> **Warning:** 非公式な自動化はアカウント停止 / BAN につながる可能性があります。自己責任で使用してください。

## 命名

チャネル ID は `zalouser` です。これは **個人 Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は、将来あり得る公式 Zalo API 統合向けに予約しています。

## 実行場所

この Plugin は **Gateway プロセス内** で動作します。

リモート Gateway を使う場合は、**Gateway を実行しているマシン** にインストール / 設定し、その後 Gateway を再起動してください。

外部の `zca` / `openzca` CLI バイナリは不要です。

## インストール

### Option A: npm からインストール

```bash
openclaw plugins install @openclaw/zalouser
```

その後 Gateway を再起動してください。

### Option B: ローカルフォルダからインストール（開発用）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後 Gateway を再起動してください。

## 設定

チャネル設定は `channels.zalouser` 配下に置きます（`plugins.entries.*` ではありません）:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## エージェントツール

ツール名: `zalouser`

アクション: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

チャネルメッセージアクションは、メッセージリアクション用に `react` もサポートします。

## 関連

- [Building plugins](/ja-JP/plugins/building-plugins)
- [Community plugins](/ja-JP/plugins/community)
