---
read_when:
    - OpenClawでZalo Personal（非公式）対応を利用したい
    - zalouser Plugin を設定または開発しています
summary: 'Zalo Personalプラグイン: ネイティブ zca-js によるQRログイン + メッセージング（プラグインインストール + チャンネル設定 + ツール）'
title: Zalo 個人用 Plugin
x-i18n:
    generated_at: "2026-05-02T22:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

ネイティブの `zca-js` を使用して通常の Zalo ユーザーアカウントを自動化する、Plugin による OpenClaw の Zalo Personal サポート。

<Warning>
非公式の自動化により、アカウントの一時停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## 命名

チャンネル ID は `zalouser` です。これは **個人用 Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。将来の公式 Zalo API 統合の可能性に備えて、`zalo` は予約したままにしています。

## 実行場所

この Plugin は **Gateway プロセス内** で実行されます。

リモート Gateway を使用する場合は、**Gateway を実行しているマシン**にインストール/設定してから、Gateway を再起動してください。

外部の `zca`/`openzca` CLI バイナリは不要です。

## インストール

### オプション A: npm からインストール

```bash
openclaw plugins install @openclaw/zalouser
```

現在の公式リリースタグに追従するには、ベアパッケージを使用します。再現可能なインストールが必要な場合にのみ、正確なバージョンに固定してください。

その後、Gateway を再起動してください。

### オプション B: ローカルフォルダーからインストール（開発）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gateway を再起動してください。

## 設定

チャンネル設定は `channels.zalouser` の下にあります（`plugins.entries.*` ではありません）。

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

チャンネルメッセージアクションは、メッセージリアクション用の `react` もサポートしています。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [コミュニティ Plugin](/ja-JP/plugins/community)
