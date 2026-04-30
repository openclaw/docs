---
read_when:
    - OpenClaw で Zalo Personal（非公式）サポートを利用したい場合
    - zalouser Pluginを設定または開発しています
summary: 'Zalo Personal Plugin: ネイティブ zca-js による QR ログイン + メッセージング（Plugin インストール + チャネル設定 + ツール）'
title: Zalo 個人用 Plugin
x-i18n:
    generated_at: "2026-04-30T05:29:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

ネイティブの `zca-js` を使用して通常の Zalo ユーザーアカウントを自動化する、Plugin による OpenClaw の Zalo Personal サポート。

<Warning>
非公式の自動化により、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## 命名

Channel id は `zalouser` です。これは **個人の Zalo ユーザーアカウント**（非公式）を自動化することを明示するためです。`zalo` は、将来の公式 Zalo API 統合の可能性のために予約しています。

## 実行場所

この Plugin は **Gateway プロセス内**で実行されます。

リモート Gateway を使用する場合は、**Gateway を実行しているマシン**にインストール/設定してから、Gateway を再起動してください。

外部の `zca`/`openzca` CLI バイナリは不要です。

## インストール

### オプション A: npm からインストール

```bash
openclaw plugins install @openclaw/zalouser
```

npm が OpenClaw 所有のパッケージを deprecated と報告する場合、そのパッケージバージョンは古い外部パッケージ系列のものです。新しい npm パッケージが公開されるまでは、現在のパッケージ化された OpenClaw ビルドまたはローカルフォルダーパスを使用してください。

その後、Gateway を再起動してください。

### オプション B: ローカルフォルダーからインストール（開発）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gateway を再起動してください。

## 設定

Channel config は `channels.zalouser`（`plugins.entries.*` ではありません）の下にあります。

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

## Agent ツール

ツール名: `zalouser`

アクション: `send`、`image`、`link`、`friends`、`groups`、`me`、`status`

Channel message actions は、メッセージのリアクション用に `react` もサポートします。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [コミュニティ Plugin](/ja-JP/plugins/community)
