---
read_when:
    - OpenClaw で Zalo Personal（非公式）対応を利用したい
    - zalouser pluginを設定または開発しています
summary: 'Zalo Personal Plugin: ネイティブ zca-js による QR ログイン + メッセージング (Plugin インストール + チャンネル設定 + ツール)'
title: Zalo 個人用Plugin
x-i18n:
    generated_at: "2026-05-10T19:48:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw の Zalo Personal 対応をプラグインで提供し、ネイティブの `zca-js` を使って通常の Zalo ユーザーアカウントを自動化します。

<Warning>
非公式の自動化により、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## 命名

チャネル id は `zalouser` です。これは、**個人の Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は将来の公式 Zalo API 統合の可能性のために予約しています。

## 実行場所

このプラグインは **Gateway プロセス内**で実行されます。

リモート Gateway を使用する場合は、**Gateway を実行しているマシン**にインストールして設定し、その後 Gateway を再起動してください。

外部の `zca`/`openzca` CLI バイナリは不要です。

## インストール

### オプション A: npm からインストール

```bash
openclaw plugins install @openclaw/zalouser
```

現在の公式リリースタグに追従するには、素のパッケージを使用してください。再現可能なインストールが必要な場合のみ、正確なバージョンに固定してください。

その後、Gateway を再起動してください。

### オプション B: ローカルフォルダーからインストール（開発）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gateway を再起動してください。

## 設定

チャネル設定は `channels.zalouser`（`plugins.entries.*` ではありません）配下にあります。

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

チャネルメッセージアクションは、メッセージリアクション用の `react` もサポートしています。

## 関連

- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [ClawHub](/ja-JP/clawhub)
