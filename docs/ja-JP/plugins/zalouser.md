---
read_when:
    - OpenClaw で Zalo Personal（非公式）サポートを利用したい
    - zalouserプラグインを設定または開発しています
summary: 'Zalo Personal Plugin: ネイティブ zca-js による QRログイン + メッセージング (Plugin インストール + チャンネル設定 + ツール)'
title: Zalo 個人用 Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

ネイティブの `zca-js` を使用して通常の Zalo ユーザーアカウントを自動化する、Plugin 経由の OpenClaw 向け Zalo Personal サポート。

<Warning>
非公式の自動化により、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## 命名

チャンネル ID は `zalouser` です。これは **個人の Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。将来の公式 Zalo API 連携の可能性に備えて、`zalo` は予約しています。

## 実行場所

この Plugin は **Gateway プロセス内**で実行されます。

リモート Gateway を使用している場合は、**Gateway を実行しているマシン**にインストールして設定し、その後 Gateway を再起動します。

外部の `zca`/`openzca` CLI バイナリは不要です。

## インストール

### オプション A: npm からインストール

```bash
openclaw plugins install @openclaw/zalouser
```

現在の公式リリースタグに追従するには、裸のパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンに固定してください。

その後、Gateway を再起動します。

### オプション B: ローカルフォルダーからインストール（開発）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gateway を再起動します。

## 設定

チャンネル設定は `channels.zalouser` 配下にあります（`plugins.entries.*` ではありません）。

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

アクション: `send`、`image`、`link`、`friends`、`groups`、`me`、`status`

チャンネルメッセージのアクションは、メッセージリアクション用の `react` もサポートします。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [コミュニティ Plugin](/ja-JP/plugins/community)
